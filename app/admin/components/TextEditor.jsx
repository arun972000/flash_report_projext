'use client';

import React, { useEffect, useState } from 'react';
import {
    Container,
    Form,
    Button,
    Image,
    Accordion
} from 'react-bootstrap';
import axios from 'axios';
import ReactQuill from 'react-quill';
import { ToastContainer, toast } from 'react-toastify';
import { FaImage, FaFileUpload, FaSave } from 'react-icons/fa';
import 'react-quill/dist/quill.snow.css';
import 'react-toastify/dist/ReactToastify.css';
import './SegmentEditor.css';

import OverAllexcelUpload from '../components/overall/Overall';
import Overallbar from '../components/overall-2/Overallbar';
import TwoWheelerChartUploads from '../components/twowheeler/Overallpie';
import ThreeWheelerChartUpload from '../components/threewheeler/Threew';
import CommercialChartUploads from '../components/commercial-vehicle/Commercialoverall';
import TruckChartUpload from '../components/truck-overall/Truckoverall';
import BusChartUpload from '../components/bus/Bus';
import PassengerChartUpload from '../components/passenger/Passenger';
import TractorChartUpload from '../components/tractoroverall/Tractor-overall';
import Commercialsegment from "../components/commercial-segment/Commercialsegment"

const SegmentLabel = {
    overall: 'Overall OEM',
    twowheeler: 'Two-Wheeler',
    threewheeler: 'Three-Wheeler',
    commercial_vehicle: 'Commercial Vehicle',
    passenger_vehicle: 'Passenger Vehicle',
    tractor: 'Tractor',
    truck: 'Truck',
    bus: 'Bus'
};

const segmentFields = {
    overall: [
        { name: 'overall_oem_main', label: 'Overall OEM (Main)', max: 1000 },
        { name: 'overall_oem_secondary', label: 'Overall OEM (Secondary)', max: 1100 },
    ],
    twowheeler: [
        { name: 'twowheeler', label: 'Two-Wheeler', max: 1300 },
        { name: 'highlighted_twowheeler', label: 'Highlighted Two-Wheeler Heading', max: 100, isHeading: true },
    ],
    threewheeler: [
        { name: 'threewheeler', label: 'Three-Wheeler', max: 1500 },
        { name: 'highlighted_threewheeler', label: 'Highlighted Three-Wheeler Heading', max: 100, isHeading: true },
    ],
    commercial_vehicle: [
        { name: 'commercial_vehicle', label: 'Commercial Vehicle', max: 1500 },
        { name: 'highlighted_commercial_vehicle', label: 'Highlighted Commercial Vehicle Heading', max: 100, isHeading: true },
    ],
    passenger_vehicle: [
        { name: 'passenger_vehicle_main', label: 'Passenger Vehicle (Main)', max: 1500 },
        { name: 'passenger_vehicle_secondary', label: 'Passenger Vehicle (Secondary)', max: 1100 },
        { name: 'highlighted_passenger_vehicle', label: 'Highlighted Passenger Vehicle Heading', max: 100, isHeading: true },
    ],
    tractor: [
        { name: 'tractor', label: 'Tractor', max: 1700 },
        { name: 'highlighted_tractor', label: 'Highlighted Tractor Heading', max: 100, isHeading: true },
    ],
    truck: [
        { name: 'truck', label: 'Truck', max: 1600 },
    ],
    bus: [
        { name: 'bus', label: 'Bus', max: 1600 },
    ]
};

const SegmentEditor = () => {
    const [selectedSegment, setSelectedSegment] = useState('overall');
    const [formData, setFormData] = useState({});
    const [charCounts, setCharCounts] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [mobileImageFile, setMobileImageFile] = useState(null);
    const [mobileImagePreview, setMobileImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`/api/admin/flash-dynamic/flash-reports-text`);
                setFormData(response.data || {});
                const initialCounts = {};
                Object.entries(response.data || {}).forEach(([key, html]) => {
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    const text = div.textContent || div.innerText || '';
                    initialCounts[key] = text.length;
                });
                if (response.data?.main_banner_url) {
                    setImagePreview(response.data.main_banner_url.startsWith('http') ? response.data.main_banner_url : `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${response.data.main_banner_url}`);
                }
                if (response.data?.mobile_banner_url) {
                    setMobileImagePreview(response.data.mobile_banner_url.startsWith('http') ? response.data.mobile_banner_url : `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${response.data.mobile_banner_url}`);
                }
                setCharCounts(initialCounts);
            } catch {
                toast.error('Failed to load data');
            }
        };
        fetchData();
    }, []);

    const handleChange = (field, value) => {
        const div = document.createElement('div');
        div.innerHTML = value;
        const text = div.textContent || div.innerText || '';
        const charCount = text.length;
        if (charCount <= field.max) {
            setFormData((prev) => ({ ...prev, [field.name]: value }));
        }
        setCharCounts((prev) => ({ ...prev, [field.name]: charCount }));
    };

    const handleAdditionalHeadingChange = (value) => {
        const key = `${selectedSegment}_heading`;
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleAlternateFuelHeadingChange = (value) => {
        setFormData((prev) => ({ ...prev, alternative_fuel_heading: value }));
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const onMobileFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMobileImageFile(file);
        setMobileImagePreview(URL.createObjectURL(file));
    };

    const handleImageUpload = async () => {
        if (!imageFile && !mobileImageFile) {
            toast.error('Please select at least one image to upload.');
            return;
        }
        setUploadingImage(true);
        const formDataImage = new FormData();
        if (imageFile) formDataImage.append('main_banner', imageFile);
        if (mobileImageFile) formDataImage.append('mobile_banner', mobileImageFile);

        try {
            const response = await axios.put(`/api/admin/flash-dynamic/flash-image`, formDataImage);
            if (response.data.mainBannerUrl) {
                setFormData((prev) => ({ ...prev, main_banner_url: response.data.mainBannerUrl }));
                setImagePreview(response.data.mainBannerUrl.startsWith('http') ? response.data.mainBannerUrl : `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${response.data.mainBannerUrl}`);
            }
            if (response.data.mobileBannerUrl) {
                setFormData((prev) => ({ ...prev, mobile_banner_url: response.data.mobileBannerUrl }));
                setMobileImagePreview(response.data.mobileBannerUrl.startsWith('http') ? response.data.mobileBannerUrl : `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${response.data.mobileBannerUrl}`);
            }
            setImageFile(null);
            setMobileImageFile(null);
            toast.success('Banner(s) uploaded successfully');
        } catch {
            toast.error('Image upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            delete payload.imageFile;
            await axios.post(`/api/admin/flash-dynamic/flash-reports-text`, payload);
            toast.success('Update saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving data');
        }
    };

    const modules = { toolbar: [[{ color: [] }], ['bold', 'italic', 'underline'], ['clean']] };
    const formats = ['color', 'bold', 'italic', 'underline'];

    return (
        <Container className="bg-dark p-4 rounded">
            <ToastContainer position="top-right" autoClose={3000} />
            <h4 className="text-info mb-4">Segment Market Update Editor</h4>

            <Form.Select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="mb-4 bg-secondary text-white border-0"
            >
                {Object.entries(SegmentLabel).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </Form.Select>

            <Accordion defaultActiveKey="0" className="mb-4">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Upload Excel Data</Accordion.Header>
                    <Accordion.Body>
                        {selectedSegment === 'overall' && <><OverAllexcelUpload /><Overallbar /></>}
                        {selectedSegment === 'twowheeler' && <TwoWheelerChartUploads />}
                        {selectedSegment === 'threewheeler' && <ThreeWheelerChartUpload />}
                        {selectedSegment === 'commercial_vehicle' && <><CommercialChartUploads /> <Commercialsegment/></>}
                        {selectedSegment === 'truck' && <TruckChartUpload />}
                        {selectedSegment === 'bus' && <BusChartUpload />}
                        {selectedSegment === 'passenger_vehicle' && <PassengerChartUpload />}
                        {selectedSegment === 'tractor' && <TractorChartUpload />}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                    <Form.Label className="text-light">Flash Report Edition Name</Form.Label>
                    <Form.Control
                        type="text"
                        className="bg-secondary text-white"
                        value={formData.flash_reports_edition || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, flash_reports_edition: e.target.value }))}
                        placeholder="Enter edition name, e.g., May 2025"
                    />
                </Form.Group>

                {(segmentFields[selectedSegment] || []).map((field) => (
                    <Form.Group key={field.name} className="mb-4">
                        <Form.Label className="text-light">{field.label} (Max: {field.max} characters)</Form.Label>
                        <ReactQuill
                            theme="snow"
                            value={formData[field.name] || ''}
                            onChange={(value) => handleChange(field, value)}
                            modules={modules}
                            formats={formats}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                        <div className="text-muted small mt-1">
                            {charCounts[field.name] || 0} / {field.max} characters
                            {charCounts[field.name] > field.max && (
                                <span className="text-danger ms-2">Limit exceeded!</span>
                            )}
                        </div>
                    </Form.Group>
                ))}

                <Form.Group className="mb-4">
                    <Form.Label className="text-light">{SegmentLabel[selectedSegment]} Additional Heading</Form.Label>
                    <Form.Control
                        type="text"
                        className="bg-secondary text-white"
                        value={formData[`${selectedSegment}_heading`] || ''}
                        onChange={(e) => handleAdditionalHeadingChange(e.target.value)}
                    />
                </Form.Group>

                {selectedSegment === 'overall' && (
                    <Form.Group className="mb-4">
                        <Form.Label className="text-light">Alternate Fuel Heading</Form.Label>
                        <Form.Control
                            type="text"
                            className="bg-secondary text-white"
                            value={formData.alternative_fuel_heading || ''}
                            onChange={(e) => handleAlternateFuelHeadingChange(e.target.value)}
                        />
                    </Form.Group>
                )}

                <h5 className="mt-4 text-info">Upload Banner Images</h5>

                <Form.Group className="mb-3">
                    <Form.Label><FaImage className="me-2" />Upload Desktop Banner</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={onFileChange} className="bg-dark text-white" />
                </Form.Group>
                {imagePreview && <Image src={imagePreview} thumbnail style={{ width: '250px' }} className="mb-3" />}

                <Form.Group className="mb-3">
                    <Form.Label><FaImage className="me-2" />Upload Mobile Banner</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={onMobileFileChange} className="bg-dark text-white" />
                </Form.Group>
                {mobileImagePreview && <Image src={mobileImagePreview} thumbnail style={{ width: '150px' }} className="mb-4" />}

                <Button variant="outline-warning" onClick={handleImageUpload} disabled={uploadingImage} className="mb-4">
                    <FaFileUpload className="me-2" />{uploadingImage ? 'Uploading...' : 'Upload Banner Images'}
                </Button>

                <hr className="border-light" />

                <Button variant="success" type="submit" className="w-100 py-2">
                    <FaSave className="me-2" />Save Final Market Update
                </Button>
            </Form>
        </Container>
    );
};

export default SegmentEditor;
