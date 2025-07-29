"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./score.css";
import { notification, Button } from "antd";
import Image from "next/image";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useCurrentPlan } from "../hooks/useCurrentPlan";
import { useRouter, useSearchParams } from "next/navigation";
import LoginNavButton from "../flash-reports/components/Login/LoginAuthButton";

export default function ScoreCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const graphId = searchParams.get("graphId"); // ← string or null
  const { email } = useCurrentPlan(); // ← grabs the JWT’s payload.email
  const [value, setValue] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [years, setYears] = useState([]);
  const [dropdownOpts, setDropdownOpts] = useState([]);
  const [selectedValues, setSelectedValues] = useState([]);
  const [skipFlags, setSkipFlags] = useState([]);
  const [incompleteFlags, setIncompleteFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [graphName, setGraphName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);

  // 0) load the graph’s metadata (name, etc.)
  useEffect(() => {
    async function fetchGraph() {
      try {
        const graphs = await (
          await fetch("/api/graphs", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
            },
          })
        ).json();
        const g = graphs.find((g) => String(g.id) === graphId);
        if (!g) return;

        setGraphName(g.name);

        // dataset id
        const dsId = g.dataset_ids;
        if (!dsId) return;

        // fetch volumeData and find matching entry
        const vols = await (
          await fetch("/api/volumeData", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
            },
          })
        ).json();
        const entry = vols.find((v) => Number(v.id) === Number(dsId));
        if (!entry?.stream) return;

        // take the 3rd ID from the CSV stream
        const nodeId = Number(entry.stream.split(",")[2]);
        if (isNaN(nodeId)) return;

        // fetch hierarchy and pick its name
        const nodes = await (
          await fetch("/api/contentHierarchy", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
            },
          })
        ).json();
        const node = nodes.find((n) => Number(n.id) === nodeId);
        if (node) setCategoryName(node.name);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMeta(false);
      }
    }
    if (graphId) fetchGraph();
  }, [graphId]);

  // 1) Load questions + settings
  useEffect(() => {
    if (!graphId) return;
    async function load() {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        fetch(`/api/questions?graphId=${graphId}`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }),
        fetch("/api/scoreSettings", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }),
      ]);
      const qList = await qRes.json();
      const { yearNames, scoreLabels } = await sRes.json();

      setQuestions(qList);
      setYears(yearNames);
      setDropdownOpts(scoreLabels);
      setSelectedValues(
        qList.map(() => Array(yearNames.length).fill("Select"))
      );
      setSkipFlags(qList.map(() => false));
      setIncompleteFlags(qList.map(() => false));
      setLoading(false);
    }
    load().catch((err) => {
      console.error(err);
      notification.error({ message: err.message });
      setLoading(false);
    });
  }, [graphId, notification]);

  // 2) Split positive vs negative and chunk into slides
  const chunkSize = 4;
  const { slides, driversCount } = useMemo(() => {
    const indexed = questions.map((q, idx) => ({ ...q, originalIndex: idx }));
    const positive = indexed.filter((q) => q.type === "positive");
    const negative = indexed.filter((q) => q.type === "negative");

    const makeSlides = (arr) => {
      const s = [];
      for (let i = 0; i < arr.length; i += chunkSize) {
        s.push(arr.slice(i, i + chunkSize));
      }
      return s;
    };
    const posSlides = makeSlides(positive);
    const negSlides = makeSlides(negative);
    return {
      slides: [...posSlides, ...negSlides],
      driversCount: posSlides.length,
    };
  }, [questions]);

  const totalPages = Math.max(1, slides.length);

  // 3) Skip & Submit handlers
  const handleSkip = (globalIdx) => {
    setSkipFlags((sf) => sf.map((v, i) => (i === globalIdx ? true : v)));
    setSelectedValues((sv) => {
      const copy = sv.map((arr) => [...arr]);
      copy[globalIdx] = Array(years.length).fill(null);
      return copy;
    });
  };

  const handleSubmit = async () => {
    // 0) Build an "incomplete" flag per question
    const flags = questions.map((_, idx) => {
      return !skipFlags[idx] && selectedValues[idx].some((v) => v === "Select");
    });
    // store them so we can highlight
    setIncompleteFlags(flags);
    // if any are incomplete, warn + jump + bail out
    const firstIncomplete = flags.findIndex((f) => f);
    if (firstIncomplete !== -1) {
      notification.warning({
        message: "Please Complete All Questions",
        description:
          "You need to either answer or skip every question before submitting.",
        placement: "topRight",
        duration: 4,
      });
      const slideNum = Math.floor(firstIncomplete / chunkSize);
      swiperRef.current?.slideTo(slideNum);
      setValue(slideNum + 1);
      return;
    }
    // if we get here, clear any old highlights
    setIncompleteFlags(questions.map(() => false));

    // 1) Build numeric lookup and payload
    const step = dropdownOpts.length > 1 ? 10 / (dropdownOpts.length - 1) : 0;
    const labelToScore = dropdownOpts.reduce(
      (m, lbl, i) => ({ ...m, [lbl]: i * step }),
      {}
    );
    const payload = questions.map((q, idx) => ({
      questionId: q.id,
      scores: skipFlags[idx]
        ? []
        : selectedValues[idx].map((lbl) =>
            labelToScore[lbl] != null ? labelToScore[lbl] : null
          ),
      skipped: skipFlags[idx],
    }));

    // 2) Send to API and handle response
    try {
      const res = await fetch("/api/saveScores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({
          user: email, // ← new
          graphId, // ← pass in the current graph
          results: payload,
        }),
      });

      if (res.ok) {
        notification.success({
          message: "Scores Saved",
          description: "Your input has been successfully submitted.",
          placement: "topRight",
          duration: 3,
        });
        // Reset selections back to "Select"
        setSelectedValues(
          questions.map(() => Array(years.length).fill("Select"))
        );
        setSkipFlags(questions.map(() => false));
        // Return to first slide
        swiperRef.current?.slideTo(0);
        setValue(1);
      } else {
        const errorText = await res.text();
        notification.error({
          message: "Submit Failed",
          description: errorText,
          placement: "topRight",
          duration: 5,
        });
      }
    } catch (err) {
      notification.error({
        message: "Network Error",
        description: err.message,
        placement: "topRight",
        duration: 5,
      });
    }
  };

  // 4) Swiper ref for programmatic control
  const swiperRef = useRef(null);

  // 5) Slider-control
  const handleSliderChange = (e) => {
    const v = Number(e.target.value);
    setValue(v);
    swiperRef.current?.slideTo(v - 1);
  };

  const isBarrierHeader = value - 1 >= driversCount;

  const handleSuggestions = () => {
    // build subject line
    const subject = `Score card suggestions for ${categoryName} – ${graphName}`;
    // build a starter body (feel free to tweak)
    const body = [
      `Hello team,`,
      ``,
      `I have some suggestions for the score card "${categoryName} – ${graphName}".`,
      `Please see below:`,
      ``,
      `1. …`,
      `2. …`,
      ``,
      `Thanks,`,
      `${email || "—"}`,
    ].join("\n");
    // open user’s mail client
    window.location.href =
      `mailto:info@raceautoindia.com` + // preset the To: line
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  };

  // If they somehow navigated here without a graphId, send them back
  if (!graphId) {
    router.replace("/forecast");
    return null;
  }

  if (loadingMeta) return <div>Loading…</div>;

  // While we’re waiting on the API…
  if (loading) {
    return <div>Loading questions…</div>;
  }

  // If the fetch succeeded but there are no questions at all
  // (i.e. that graph just hasn’t had any added yet)…
  if (!loading && !questions.length) {
    return (
      <div>No scoring questions have been configured for this graph yet.</div>
    );
  }

  return (
    <div className="container-wrapper shadow custom-border m-4">
      {/* Login logic */}
      <div style={{ display: "none" }}>
        <LoginNavButton />
      </div>

      {/* Header + Next/Submit */}
      <div className="container-fluid p-0 m-0 mt-3">
        <div
          className="d-flex align-items-center justify-content-between w-100 px-3"
          style={{ height: "80px" }}
        >
          <Image
            src="/images/logo.png"
            alt="Company Logo"
            width={43}
            height={43}
            className="img-fluid rounded shadow-sm"
          />
          <div className="text-center flex-grow-1">
            <h1
              className="mb-0 fw-bold"
              style={{ color: "#12298C", fontSize: "35px" }}
            >
              {categoryName ? `${categoryName} – ` : ""}
              {graphName || "Loading…"}
            </h1>
            <h4 className="mb-0" style={{ fontSize: "20px" }}>
              Unit Sales Drivers, Ranked in Order of Impact 2025 - 2029
            </h4>
          </div>
          <button
            className="btn text-white fw-bold d-flex align-items-center px-3"
            style={{ backgroundColor: "#1D478A", borderRadius: "5px" }}
            onClick={async () => {
              if (value < totalPages) {
                swiperRef.current?.slideNext();
              } else {
                await handleSubmit();
              }
            }}
          >
            {value < totalPages ? "Next" : "Submit"}{" "}
            <span className="ms-2" style={{ fontSize: "18px" }}>
              →
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic KEY DRIVERS / KEY BARRIERS Header */}
      <div className="container-fluid mt-3 fw-bold">
        <div
          className="d-flex justify-content-between align-items-center p-2 ms-1 mt-4"
          style={{
            backgroundColor: isBarrierHeader
              ? "rgba(250,204,204,0.8)"
              : "rgba(204,250,236,0.8)",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ color: isBarrierHeader ? "#8B0000" : "#12298C" }}>
            {isBarrierHeader ? "KEY BARRIERS" : "KEY DRIVERS"}
          </h3>
          <div className="year-grid" style={{ marginRight: "4em" }}>
            {years.map((yr, idx) => (
              <h5
                key={idx}
                style={{ color: isBarrierHeader ? "#B22222" : "#1D478A" }}
              >
                {yr}
              </h5>
            ))}
          </div>
        </div>
      </div>

      {/* Swiper Slides */}
      <div className="container-fluid mt-3 fw-bold">
        <Swiper
          slidesPerView={1}
          modules={[Navigation]}
          onSwiper={(sw) => (swiperRef.current = sw)}
          onSlideChange={(sw) => setValue(sw.activeIndex + 1)}
          navigation={false}
        >
          {slides.map((slideQs, sIdx) => (
            <SwiperSlide key={sIdx}>
              {slideQs.map((item) => {
                const gIdx = item.originalIndex;
                const isBarrier = sIdx >= driversCount;
                return (
                  <div
                    key={gIdx}
                    className={`d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-3 mt-2 w-100
         ${incompleteFlags[gIdx] ? "incomplete-question" : ""}`}
                    style={{
                      backgroundColor: isBarrier ? "#F5A9A9" : "#5EC2A4",
                      borderRadius: "8px",
                    }}
                  >
                    <div className="w-100 w-md-50">
                      <p className="text-black fs-6 text-wrap m-0">
                        {item.text}
                      </p>
                    </div>
                    <div className="d-flex align-items-center justify-content-end w-100 w-md-50 mt-2 mt-md-0">
                      <div className="year-grid">
                        {years.map((_, yIdx) => (
                          <select
                            key={yIdx}
                            className="form-select fw-bold"
                            style={{ width: "110px", fontSize: "12px" }}
                            value={selectedValues[gIdx]?.[yIdx] || "Select"}
                            disabled={skipFlags[gIdx]} // ← disable if skipped
                            onChange={(e) =>
                              setSelectedValues((sv) => {
                                const copy = sv.map((arr) => [...arr]);
                                copy[gIdx][yIdx] = e.target.value;
                                return copy;
                              })
                            }
                          >
                            <option value="Select">Select</option>
                            {dropdownOpts.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>

                      <button
                        className="d-flex align-items-center px-2 py-1 rounded ms-3"
                        style={{
                          backgroundColor: isBarrier ? "#F5A9A9" : "#66C2A5",
                          border: "none",
                          opacity: skipFlags[gIdx] ? 0.6 : 1, // fade when skipped
                          cursor: skipFlags[gIdx] ? "default" : "pointer",
                        }}
                        onClick={() => handleSkip(gIdx)}
                        disabled={skipFlags[gIdx]} // make non-clickable
                      >
                        <span className="text-dark fw-semibold">
                          {skipFlags[gIdx] ? "Skipped" : "Skip"}
                        </span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="black"
                          className="mt-1"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M6 4l8 8-8 8V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Note */}
        <div className="d-inline" style={{ fontSize: "16px" }}>
          <span className="text-danger">Note:</span>{" "}
          <span className="ms-1 mt-2">
            These questions assess key factors shaping the{" "}
            <strong>{categoryName || "CV"} industry</strong>, with positive ones
            highlighting growth drivers and negative ones identifying
            challenges. Higher impact responses indicate strong market shifts,
            while lower ones suggest stability. This approach enables better
            forecasting and strategic planning.
          </span>
        </div>

        {/* Navigation & Progress Bar */}
        <div className="d-flex flex-column align-items-center justify-content-center mt-3 w-100">
          <div className="d-flex align-items-center w-75 position-relative">
            <button
              className="border-0 bg-transparent d-flex align-items-center"
              style={{ fontSize: "30px", lineHeight: "1" }}
              onClick={() => swiperRef.current?.slidePrev()}
            >
              ❮
            </button>
            <div
              className="position-relative flex-grow-1 mx-3"
              style={{ height: "7px", width: "100%" }}
            >
              <div
                style={{
                  height: "7px",
                  width: "100%",
                  background: "#c6b5b5",
                  borderRadius: "10px",
                  position: "absolute",
                }}
              />
              <div
                style={{
                  height: "7px",
                  width: `${(value / totalPages) * 100}%`,
                  background: "#4683A6",
                  borderRadius: "10px",
                  position: "absolute",
                  transition: "width 0.3s ease",
                }}
              />
              <input
                type="range"
                min="1"
                max={totalPages}
                value={value}
                onChange={handleSliderChange}
                className="form-range position-absolute"
                style={{
                  width: "100%",
                  height: "10px",
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </div>
            <button
              className="border-0 bg-transparent d-flex align-items-center"
              style={{ fontSize: "30px", lineHeight: "1" }}
              onClick={() => swiperRef.current?.slideNext()}
            >
              ❯
            </button>
          </div>
          {/* new */}
          <div
            className="position-relative mt-4"
            style={{ height: "1.5rem" /* enough for your font-size */ }}
          >
            {/* centered page count */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                color: "#12298C",
                fontWeight: 600,
                fontSize: "1.25rem",
              }}
            >
              {value}/{totalPages}
            </div>

            {/* offset button, tweak the 2rem as needed */}
            <Button
              type="link"
              onClick={handleSuggestions}
              style={{
                position: "absolute",
                left: "40em",
              }}
            >
              Have suggestions?
            </Button>
          </div>
        </div>

        {/* Impact Levels */}
        <div className="row mt-5">
          <div className="col-md-4" style={{ fontSize: "16px" }}>
            <ul>
              <li>
                VERY HIGH – Strong influence, directly shaping industry trends.
              </li>
              <li>HIGH – Significant influence on market movement.</li>
              <li>MEDIUM HIGH – Noticeable but not dominant impact.</li>
            </ul>
          </div>
          <div className="col-md-4" style={{ fontSize: "16px" }}>
            <ul>
              <li>
                MEDIUM – Moderate influence, dependent on external factors.
              </li>
              <li>MEDIUM LOW – Noticeable but not dominant impact.</li>
              <li>LOW – Minimal impact on overall industry.</li>
            </ul>
          </div>
          <div className="col-md-4" style={{ fontSize: "16px" }}>
            <ul>
              <li>VERY LOW – Negligible or nearly no effect.</li>
              <li>NO IMPACT – No expected influence on industry trends.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
