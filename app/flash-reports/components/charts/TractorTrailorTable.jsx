'use client'
import React, { useState } from 'react';

const PASSCODE = 'Tractor-trailer-Flash@2025&';

const TractorTrailerForecast = () => {
    const [entered, setEntered] = useState('');
    const [authed, setAuthed] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (entered === PASSCODE) {
            setAuthed(true);
            setError('');
        } else {
            setError('Incorrect passcode. Please try again.');
        }
    };

    return (
        <div style={{ padding: 20, color: '#fff', background: '#121212' }} className='mt-4'>
            <h2 style={{
                marginBottom: 12,
                fontWeight: '600',
                fontSize: '1.6rem'
            }}>
                Tractor Trailer Sales Performance
            </h2>

            {!authed ? (
                <div className='d-flex justify-content-center'>
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            background: '#1f1f1f',
                            padding: '20px 18px',
                            borderRadius: 10,
                            border: '1px solid #2f2f2f',
                            width: '100%',
                            maxWidth: 360,
                            boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
                            marginTop: 8
                        }}
                    >
                        <p style={{
                            color: '#bbb',
                            marginBottom: 16,
                            fontSize: '0.9rem',
                            lineHeight: 1.4
                        }}>
                            Please enter the passcode to unlock the sales data.
                        </p>

                        <input
                            type="password"
                            value={entered}
                            onChange={(e) => setEntered(e.target.value)}
                            placeholder="Enter Passcode"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: '#111',
                                color: '#fff',
                                border: '1px solid #444',
                                borderRadius: 6,
                                outline: 'none',
                                fontSize: '0.95rem',
                                marginBottom: 10
                            }}
                        />
                        {error && (
                            <div style={{ color: '#ff6b6b', marginBottom: 10, fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Unlock Data
                        </button>
                    </form>
                </div>
            ) : (
                <SalesTable />
            )}
        </div>
    );
};

const SalesTable = () => {
    const startMonth = 6; // July
    const baseDate = new Date(2025, startMonth, 1); // July 2025
    const months = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    });

    const data = {
        'Total Sales': [2281, 2355, 2866, 3482, 3612, 2155, 2299]
    };

    return (
        <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#1e1e1e',
            fontSize: '14px',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            marginTop: 12
        }}>
            <thead>
                <tr>
                    <th style={thStyle}>Segment</th>
                    {months.map((month) => (
                        <th key={month} style={thStyle}>{month}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={tdStyle}>Total Sales</td>
                    {data['Total Sales'].map((val, idx) => (
                        <td key={idx} style={tdStyle}>{val}</td>
                    ))}
                </tr>
            </tbody>
        </table>
    );
};

const thStyle = {
    padding: '10px',
    backgroundColor: '#333',
    border: '1px solid #555',
    textAlign: 'center',
    fontWeight: '600',
    color: '#ddd'
};

const tdStyle = {
    padding: '8px',
    border: '1px solid #555',
    textAlign: 'center',
    color: '#eee'
};

export default TractorTrailerForecast;
