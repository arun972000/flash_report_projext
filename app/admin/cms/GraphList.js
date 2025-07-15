"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Tag,
  Space,
  Tooltip,
  Button,
  message,
  Popconfirm,
  Empty,
  Spin,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  Input,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

export default function GraphList() {
  const [graphs, setGraphs] = useState([]);
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editGraph, setEditGraph] = useState(null);
  const [aiForecastRows, setAiForecastRows] = useState([]);
  const [raceForecastRows, setRaceForecastRows] = useState([]);
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");

  // Fetch all three endpoints in parallel
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [graphsRes, hierarchyRes, volRowsRes] = await Promise.all([
        fetch("/api/graphs", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch("/api/contentHierarchy", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch("/api/volumeData", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }).then((r) => (r.ok ? r.json() : Promise.reject())),
      ]);

      setGraphs(graphsRes);
      setContentHierarchy(hierarchyRes);

      // Build a map of volumeData by ID
      const volMap = {};
      volRowsRes.forEach((e) => {
        volMap[e.id] = e;
      });
      setVolumeDataMap(volMap);
    } catch (err) {
      console.error(err);
      message.error("Failed to load graphs or related data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Delete a graph and remove it from local state (no full reload)
  const handleDelete = useCallback(async (id) => {
    try {
      const res = await fetch("/api/graphs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      message.success("Deleted successfully");
      setGraphs((prev) => prev.filter((g) => g.id !== id));
    } catch {
      message.error("Delete failed");
    }
  }, []);

  const handleEdit = (record) => {
    setEditGraph(record);
    setDescription(record.description || "");
    setSummary(record.summary || "");
    setAiForecastRows(
      Object.entries(record.ai_forecast || {}).map(([year, value]) => ({
        year,
        value,
      }))
    );
    setRaceForecastRows(
      Object.entries(record.race_forecast || {}).map(([year, value]) => ({
        year,
        value,
      }))
    );
    setEditModalVisible(true);
  };

  const handleForecastChange = (setter, index, key, value) => {
    setter((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const handleAddRow = (setter) => {
    setter((prev) => [...prev, { year: "", value: "" }]);
  };

  const handleRemoveRow = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  // Build a simple id→name map for contentHierarchy lookups
  const idToName = useMemo(() => {
    return Object.fromEntries(contentHierarchy.map((n) => [n.id, n.name]));
  }, [contentHierarchy]);

  // Column definitions (memoized so they don’t recreate unnecessarily)
  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", width: 60 },
      { title: "Name", dataIndex: "name", ellipsis: true },

      {
        title: "Dataset",
        dataIndex: "dataset_ids",
        render: (rawIds) => {
          // Normalize to an array if it’s a single value
          const arr = Array.isArray(rawIds) ? rawIds : [rawIds];
          return (
            <Space size="small">
              {arr.map((rawId) => {
                if (rawId == null) {
                  return (
                    <Tooltip key="none" title="No dataset">
                      <Tag>—</Tag>
                    </Tooltip>
                  );
                }
                const id = Number(rawId);
                const entry = volumeDataMap[id];
                const streamPath = entry?.stream
                  ?.split(",")
                  .map((strId) => idToName[Number(strId)])
                  .filter(Boolean)
                  .join(" > ");
                return (
                  <Tooltip key={id} title={streamPath || `#${id}`}>
                    <Tag>#{id}</Tag>
                  </Tooltip>
                );
              })}
            </Space>
          );
        },
      },

      {
        title: "Forecast Methods",
        dataIndex: "forecast_types",
        render: (ft) => {
          const methods = Array.isArray(ft) ? ft : [];
          if (methods.length === 0) {
            return <em>N/A</em>;
          }
          return methods.map((m) => (
            <Tag key={m}>
              {m === "linear" ? "Linear Regression" : "Score-Based"}
            </Tag>
          ));
        },
      },

      {
        title: "Chart",
        dataIndex: "chart_type",
        render: (t) =>
          typeof t === "string" ? t.charAt(0).toUpperCase() + t.slice(1) : "—",
      },
      { title: "Summary", dataIndex: "summary", ellipsis: true },
      { title: "Description", dataIndex: "description", ellipsis: true },
      {
        title: "Forecasts",
        key: "forecast_summary",
        render: (_, record) => {
          const { ai_forecast, race_forecast } = record;

          const formatTooltip = (forecast) =>
            Object.entries(forecast || {})
              .map(([year, val]) => `${year}: ${val}`)
              .join("\n");

          const yearRange = (forecast) => {
            const years = Object.keys(forecast || {});
            return years.length
              ? `${years[0]}–${years[years.length - 1]}`
              : "null";
          };

          return (
            <Space size="small" direction="vertical">
              <Tooltip
                title={ai_forecast ? formatTooltip(ai_forecast) : "null"}
              >
                <Tag color="blue">AI: {yearRange(ai_forecast)}</Tag>
              </Tooltip>
              <Tooltip
                title={race_forecast ? formatTooltip(race_forecast) : "null"}
              >
                <Tag color="geekblue">Race: {yearRange(race_forecast)}</Tag>
              </Tooltip>
            </Space>
          );
        },
      },

      {
        title: "Created",
        dataIndex: "created_at",
        render: (dt) => (dt ? new Date(dt).toLocaleString() : "—"),
      },

      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Popconfirm
              title="Delete this graph?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          </Space>
        ),
      },
    ],
    [volumeDataMap, idToName, handleDelete]
  );

  if (loading) {
    return (
      <Spin
        tip="Loading graphs..."
        style={{ display: "block", marginTop: 50 }}
      />
    );
  }

  if (!graphs.length) {
    return (
      <Empty description="No graphs available" style={{ marginTop: 50 }} />
    );
  }

  return (
    <>
      <Modal
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={async () => {
          const ai = {};
          aiForecastRows.forEach((r) => {
            if (r.year && r.value !== "") ai[r.year] = Number(r.value);
          });
          const race = {};
          raceForecastRows.forEach((r) => {
            if (r.year && r.value !== "") race[r.year] = Number(r.value);
          });

          try {
            const res = await fetch("/api/graphs", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
              },
              body: JSON.stringify({
                id: editGraph.id,
                name: editGraph.name,
                description,
                summary,
                datasetIds: editGraph.dataset_ids,
                forecastTypes: editGraph.forecast_types,
                chartType: editGraph.chart_type,
                aiForecast: ai,
                raceForecast: race,
              }),
            });

            if (!res.ok) throw new Error();
            message.success("Forecast updated");
            setEditModalVisible(false);
            loadAll();
          } catch {
            message.error("Update failed");
          }
        }}
        title={`Edit Forecasts for: ${editGraph?.name}`}
        width={600}
        okText="Save"
      >
        <Form layout="vertical">
          <Form.Item label="Summary">
            <Input.TextArea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter summary"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item label="Description">
            <Input.TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>
        </Form>

        <h4>AI Forecast</h4>
        {aiForecastRows.map((row, i) => (
          <Row gutter={8} key={`ai-${i}`} style={{ marginBottom: 8 }}>
            <Col span={10}>
              <InputNumber
                placeholder="Year"
                value={row.year}
                onChange={(val) =>
                  handleForecastChange(setAiForecastRows, i, "year", val)
                }
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={10}>
              <InputNumber
                placeholder="Value"
                value={row.value}
                onChange={(val) =>
                  handleForecastChange(setAiForecastRows, i, "value", val)
                }
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={4}>
              <Button
                danger
                onClick={() => handleRemoveRow(setAiForecastRows, i)}
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Button
          type="dashed"
          onClick={() => handleAddRow(setAiForecastRows)}
          style={{ marginBottom: 16 }}
        >
          + Add AI Forecast
        </Button>

        <h4>Race Forecast</h4>
        {raceForecastRows.map((row, i) => (
          <Row gutter={8} key={`race-${i}`} style={{ marginBottom: 8 }}>
            <Col span={10}>
              <InputNumber
                placeholder="Year"
                value={row.year}
                onChange={(val) =>
                  handleForecastChange(setRaceForecastRows, i, "year", val)
                }
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={10}>
              <InputNumber
                placeholder="Value"
                value={row.value}
                onChange={(val) =>
                  handleForecastChange(setRaceForecastRows, i, "value", val)
                }
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={4}>
              <Button
                danger
                onClick={() => handleRemoveRow(setRaceForecastRows, i)}
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Button type="dashed" onClick={() => handleAddRow(setRaceForecastRows)}>
          + Add Race Forecast
        </Button>
      </Modal>
      <Table
        rowKey="id"
        dataSource={graphs}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </>
  );
}
