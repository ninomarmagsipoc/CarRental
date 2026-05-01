import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import '../adminCss/ReportAnalytics.css';

function ReportAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // STATES PARA SA MGA CHARTS (Gi-add ang activeRentals ug totalCars)
    const [stats, setStats] = useState({
        totalIncome: 0,
        activeUsers: 0,
        totalRentals: 0,
        carsRentedToday: 0,
        activeRentals: 0, // BAG-O
        totalCars: 0      // BAG-O
    });

    const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
    const [dailyRevenueData, setDailyRevenueData] = useState([]);
    const [popularCarsData, setPopularCarsData] = useState([]);

    const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://localhost:7263/api/analytics');
            if (!response.ok) throw new Error("Failed to fetch analytics data");
            
            const result = await response.json();
            
            if (result.statusCode === 200 && result.data) {
                // I-save ang data gikan sa database ngadto sa React states
                setStats({
                    totalIncome: result.data.totalIncome || 0,
                    activeUsers: result.data.activeUsers || 0,
                    totalRentals: result.data.totalRentals || 0,
                    carsRentedToday: result.data.carsRentedToday || 0,
                    activeRentals: result.data.activeRentals || 0, // BAG-O
                    totalCars: result.data.totalCars || 0          // BAG-O
                });
                setMonthlyRevenueData(result.data.monthlyRevenue || []);
                setDailyRevenueData(result.data.dailyRevenue || []);
                setPopularCarsData(result.data.popularCars || []);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-state">Loading Analytics Data...</div>;
    if (error) return <div className="loading-state" style={{color: 'red'}}>Error: {error}</div>;

    return (
        <div className="analytics-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Dashboard</h2>
                    <p className="page-subtitle">Monitor car rental performance and revenue based on real-time data.</p>
                </div>
                <button className="btn-primary" onClick={() => window.print()}>
                    🖨️ Print Report
                </button>
            </div>

            {/* TOP SUMMARY CARDS */}
            <div className="stats-container">
                <div className="stat-box">
                    <h4>Total Income (All Time)</h4>
                    <p className="text-green">₱{stats.totalIncome.toLocaleString()}</p>
                </div>
                <div className="stat-box">
                    <h4>Active Users</h4>
                    <p className="text-blue">{stats.activeUsers}</p>
                </div>
                <div className="stat-box">
                    <h4>Total Rentals</h4>
                    <p className="text-purple">{stats.totalRentals}</p>
                </div>
                <div className="stat-box">
                    <h4>Cars Rented Today</h4>
                    <p className="text-orange">{stats.carsRentedToday}</p>
                </div>
                {/* 🟢 GI-ADD: Active Rentals Box */}
                <div className="stat-box">
                    <h4>Active Rentals</h4>
                    <p className="text-teal" style={{ color: '#14b8a6' }}>{stats.activeRentals}</p>
                </div>
                {/* 🟢 GI-ADD: Total Cars Box */}
                <div className="stat-box">
                    <h4>Total Cars</h4>
                    <p className="text-indigo" style={{ color: '#6366f1' }}>{stats.totalCars}</p>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="charts-grid">
                {/* Monthly Revenue Bar Chart */}
                <div className="chart-card">
                    <h3>Monthly Income Report</h3>
                    <div className="chart-wrapper">
                        {monthlyRevenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value}`} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => `₱${value}`} />
                                    <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{textAlign: 'center', marginTop: '40px', color: 'gray'}}>No revenue data available for this year.</p>
                        )}
                    </div>
                </div>

                {/* Daily Revenue Line Chart */}
                <div className="chart-card">
                    <h3>Daily Income (Last 7 Days)</h3>
                    <div className="chart-wrapper">
                        {dailyRevenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value}`} />
                                    <Tooltip formatter={(value) => `₱${value}`} />
                                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{textAlign: 'center', marginTop: '40px', color: 'gray'}}>No daily revenue in the past 7 days.</p>
                        )}
                    </div>
                </div>

                {/* Most Rented Cars Pie Chart */}
                <div className="chart-card full-width">
                    <h3>Most Rented Cars (Top 5)</h3>
                    <div className="chart-wrapper pie-wrapper">
                        {popularCarsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={popularCarsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {popularCarsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{textAlign: 'center', marginTop: '100px', color: 'gray'}}>No car rental data available yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportAnalytics;