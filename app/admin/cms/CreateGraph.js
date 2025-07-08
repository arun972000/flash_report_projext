"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Space,
  Spin,
  InputNumber,
  Row,
  Col,
  TreeSelect,
} from "antd";

export default function CreateGraph() {
  const [form] = Form.useForm();
  const [datasets, setDatasets] = useState([]);
  const [hierarchyMap, setHierarchyMap] = useState({});
  const [yearNames, setYearNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [streamDropdowns, setStreamDropdowns] = useState([]);
  const [selectedStreamPath, setSelectedStreamPath] = useState([]);
  const [allVolumeDatasets, setAllVolumeDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);

  const forecastTypes = [
    { label: "Linear Regression", value: "linear" },
    { label: "Score-Based", value: "score" },
  ];
  const chartTypes = [
    { label: "Line Chart", value: "line" },
    { label: "Bar Chart", value: "bar" },
    { label: "Pie Chart", value: "pie" },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [volRows, hierarchy, scoreSettings] = await Promise.all([
          fetch("/api/volumeData", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
            },
          }).then((r) => r.json()),
          fetch("/api/contentHierarchy", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
            },
          }).then((r) => r.json()),
          fetch("/api/scoreSettings", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
            },
          }).then((r) => r.json()),
        ]);

        setContentHierarchy(hierarchy);
        setYearNames(scoreSettings.yearNames || []);
        setDatasets(
          volRows.map((d) => ({ ...d, parsedStream: d.stream.split(",") }))
        );
        const rootKeys = hierarchy
          .filter((n) => n.parent_id === null)
          .map((n) => n.id.toString());

        setExpandedKeys(rootKeys);
      } catch (e) {
        console.error(e);
        message.error("Failed to load datasets or hierarchy");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!contentHierarchy.length) return;

    const roots = contentHierarchy.filter((n) => n.parent_id === null);

    if (roots.length === 1) {
      const rootId = roots[0].id.toString();
      const initialDropdowns = [{ level: 0, options: roots, selected: rootId }];
      setStreamDropdowns(initialDropdowns);
      updateStreamDropdown(rootId, 0, initialDropdowns);
    } else {
      setStreamDropdowns([{ level: 0, options: roots, selected: null }]);
    }
  }, [contentHierarchy]);

  const updateStreamDropdown = (selectedId, levelIndex, dropdownsOverride) => {
    const updated = dropdownsOverride
      ? [...dropdownsOverride]
      : [...streamDropdowns];
    if (!updated[levelIndex]) return;

    updated[levelIndex].selected = selectedId;
    updated.splice(levelIndex + 1);

    const children = contentHierarchy.filter(
      (n) => n.parent_id === parseInt(selectedId)
    );
    if (children.length) {
      updated.push({
        level: levelIndex + 1,
        options: children,
        selected: null,
      });
    }

    setStreamDropdowns(updated);

    const path = updated.map((d) => d.selected).filter(Boolean);
    setSelectedStreamPath(path);
  };

  const filteredDatasetOptions = useMemo(() => {
    if (!selectedStreamPath.length) return [];

    const pathStr = selectedStreamPath.join(",");
    return datasets
      .filter((d) => d.stream.startsWith(pathStr))
      .map((d) => {
        const streamNames = d.stream
          .split(",")
          .map(
            (id) => contentHierarchy.find((n) => n.id.toString() === id)?.name
          )
          .join(" > ");
        const date = new Date(d.createdAt).toLocaleDateString();
        return {
          label: `#${d.id} — ${streamNames} (${date})`,
          value: d.id,
        };
      });
  }, [datasets, selectedStreamPath, contentHierarchy]);

  const buildTreeData = (nodes, parentId = null) => {
    return nodes
      .filter((n) => n.parent_id === parentId)
      .map((node) => {
        const children = buildTreeData(nodes, node.id);
        return {
          title: node.name,
          value: node.id.toString(),
          key: node.id.toString(),
          children: children.length ? children : undefined,
        };
      });
  };

  const treeData = useMemo(
    () => buildTreeData(contentHierarchy),
    [contentHierarchy]
  );

  const onFinish = useCallback(
    async (values) => {
      try {
        const aiForecast = {};
        const raceForecast = {};
        if (values.chartType === "line") {
          for (let y of yearNames) {
            aiForecast[y] = values[`ai_${y}`];
            raceForecast[y] = values[`race_${y}`];
          }
        }

        const payload = {
          name: values.name,
          datasetIds: values.datasetId,
          chartType: values.chartType,
          forecastTypes: values.forecastTypes || null,
          aiForecast,
          raceForecast,
        };

        const res = await fetch("/api/graphs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Save failed");
        }

        const created = await res.json();
        message.success(`Graph \"${created.name}\" (#${created.id}) created!`);
        form.resetFields();
      } catch (e) {
        message.error(e.message || "Creation failed");
      }
    },
    [form, yearNames]
  );

  if (loading) {
    return (
      <Spin
        tip="Loading datasets..."
        style={{ display: "block", marginTop: 50 }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <h2>Create Graph</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ chartType: "line" }}
      >
        <Form.Item
          name="name"
          label="Graph Name"
          rules={[{ required: true, message: "Please enter a graph name" }]}
        >
          <Input placeholder="e.g. Sales Trend 2020–2025" />
        </Form.Item>

        <Form.Item label="Historical Dataset Filter" >
          <TreeSelect
            style={{ width: "100%" }}
            value={selectedStreamPath[selectedStreamPath.length - 1] || null}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            treeData={treeData}
            placeholder="Select stream"
            onChange={(val) => {
              const path = [];
              let current = contentHierarchy.find(
                (n) => n.id.toString() === val
              );

              while (current) {
                path.unshift(current.id.toString());
                current = contentHierarchy.find(
                  (n) => n.id === current.parent_id
                );
              }

              setSelectedStreamPath(path);
            }}
            treeExpandedKeys={expandedKeys}
            onTreeExpand={(keys) => setExpandedKeys(keys)}
            showSearch
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="datasetId"
          label="Historical Dataset"
          rules={[{ required: true, message: "Select a dataset" }]}
        >
          <Select
            placeholder="Choose a dataset"
            options={filteredDatasetOptions}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="chartType"
          label="Chart Type"
          rules={[{ required: true, message: "Select a chart type" }]}
        >
          <Select
            placeholder="Select chart visualization"
            options={chartTypes}
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.chartType !== curr.chartType}
        >
          {({ getFieldValue }) =>
            getFieldValue("chartType") === "line" ? (
              <>
                <Form.Item
                  name="forecastTypes"
                  label="Forecast Methods"
                  rules={[
                    { required: true, message: "Select forecasting methods" },
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select forecasting methods"
                    options={forecastTypes}
                    allowClear
                  />
                </Form.Item>

                {/* ─── AI Forecast Volume ───────────────────────────── */}
                <Form.Item label="AI Forecast Volume" required>
                  <Row gutter={[12, 12]}>
                    {yearNames.map((year) => (
                      <Col
                        key={`ai_${year}`}
                        span={24 / Math.min(5, yearNames.length)}
                      >
                        <Form.Item
                          name={`ai_${year}`}
                          label={year}
                          labelCol={{ span: 24 }}
                          wrapperCol={{ span: 24 }}
                          rules={[
                            {
                              required: true,
                              message: `Enter AI forecast for ${year}`,
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </Form.Item>

                {/* ─── Race Insights Forecast Volume ───────────────── */}
                <Form.Item label="Race Insights Forecast Volume" required>
                  <Row gutter={[12, 12]}>
                    {yearNames.map((year) => (
                      <Col
                        key={`race_${year}`}
                        span={24 / Math.min(5, yearNames.length)}
                      >
                        <Form.Item
                          name={`race_${year}`}
                          label={year}
                          labelCol={{ span: 24 }}
                          wrapperCol={{ span: 24 }}
                          rules={[
                            {
                              required: true,
                              message: `Enter Race forecast for ${year}`,
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
              </>
            ) : null
          }
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Create Graph
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
