import React, { useState, useEffect, useMemo } from 'react';
import '../Css/ManagePayment.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ManagePayment() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");

    // --- PAGINATION STATES ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); 

    useEffect(() => {
        fetchAllPayments();
    }, []);

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://localhost:7263/api/payment');
            const result = await response.json();
            const status = result.statusCode || result.StatusCode;

            if (response.ok && status === 200) {
                setPayments(result.data || result.Data || []);
            } else {
                setError(result.message || result.Message || "Failed to load payments.");
            }
        } catch (err) {
            setError("Network error. Please check your backend.");
        } finally {
            setLoading(false);
        }
    };

    const totalTransactions = payments.length;

    const totalCompleted = payments.filter(p => {
        const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
        return status === 'completed' || status === 'full' || status === 'paid';
    }).length;

    const totalRevenue = payments.reduce((sum, p) => {
        const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
        const amount = p.amount || p.Amount || 0;
        const reason = (p.refundReason || p.RefundReason || p.reason || p.Reason || "").toLowerCase();

        if (status === 'refunded' && (reason.includes('cancel') || reason.includes('75%'))) {
            return sum + (amount * 0.25);
        }
        if (status === 'rejected' || status === 'refunded' || status === 'failed' || status === 'cancelled') {
            return sum;
        }
        return sum + amount;
    }, 0);

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        csvContent += "--- REGULAR PAYMENTS ---\n";
        csvContent += "Payment ID,Customer,Rental ID,Total Amount,Status,Method,Date\n";

        const regularPayments = payments.filter(p => {
            const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();

            return status !== 'rejected' && status !== 'failed';
        });

        regularPayments.forEach(p => {
            const date = new Date(p.createdAt || p.CreatedAt).toLocaleDateString();
            const row = [
                p.paymentID || p.PaymentID,
                `"${p.userName || p.UserName}"`,
                p.rentalID || p.RentalID,
                p.totalAmount || p.TotalAmount || p.amount || p.Amount,
                p.paymentStatus || p.PaymentStatus,
                p.paymentMethod || p.PaymentMethod,
                date
            ].join(",");
            csvContent += row + "\n";
        });

        csvContent += "\n--- CANCELLATION CHARGES (25% Fee) ---\n";
        csvContent += "Payment ID,Customer,Rental ID,Charge Amount,Status,Method,Date\n";

        const cancelledPayments = payments.filter(p => {
            const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
            const reason = (p.refundReason || p.RefundReason || p.reason || p.Reason || "").toLowerCase();
            return status === 'refunded' && (reason.includes('cancel') || reason.includes('75%'));
        });

        cancelledPayments.forEach(p => {
            const date = new Date(p.createdAt || p.CreatedAt).toLocaleDateString();
            const baseAmt = p.amount || p.Amount || p.totalAmount || p.TotalAmount || 0;
            const chargeAmt = baseAmt * 0.25; // 25% charge

            const row = [
                p.paymentID || p.PaymentID,
                `"${p.userName || p.UserName}"`,
                p.rentalID || p.RentalID,
                chargeAmt,
                "Cancellation Fee",
                p.paymentMethod || p.PaymentMethod,
                date
            ].join(",");
            csvContent += row + "\n";
        });

        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "Payments_Report_With_Cancellations.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const regularPayments = payments.filter(p => {
            const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
            return status !== 'rejected' && status !== 'failed' && status !== 'refunded';
        });

        const cancelledPayments = payments.filter(p => {
            const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
            const reason = (p.refundReason || p.RefundReason || p.reason || p.Reason || "").toLowerCase();
            return status === 'refunded' && (reason.includes('cancel') || reason.includes('75%'));
        });

        // COMPUTATIONS
        const totalReg = regularPayments.reduce((sum, p) => sum + (p.amount || p.Amount || 0), 0);
        const totalCan = cancelledPayments.reduce((sum, p) =>
            sum + ((p.amount || p.Amount || p.totalAmount || p.TotalAmount || 0) * 0.25), 0);
        const overallTotal = totalReg + totalCan;

        // GENERATE ROWS
        const regularRows = regularPayments.map(p => {
            const paidAmount = p.amount || p.Amount || 0;
            const paymentType = (p.paymentType || p.PaymentType || "").toLowerCase();
            let label = paymentType === "partial" ? "Partial Payment" : "Full Payment";

            return `
            <tr>
                <td>#${p.paymentID || p.PaymentID}</td>
                <td><span class="customer-name">${p.fullName || p.FullName || p.userName || p.UserName}</span></td>
                <td>#${p.rentalID || p.RentalID}</td>
                <td><span class="badge">${label}</span></td>
                <td>${p.paymentMethod || p.PaymentMethod}</td>
                <td>${new Date(p.createdAt || p.CreatedAt).toLocaleDateString()}</td>
                <td class="text-right">₱${paidAmount.toLocaleString()}</td>
            </tr>`;
        }).join("");

        const cancelledRows = cancelledPayments.map(p => {
            const baseAmt = p.amount || p.Amount || p.totalAmount || p.TotalAmount || 0;
            const chargeAmt = baseAmt * 0.25;

            return `
            <tr>
                <td>#${p.paymentID || p.PaymentID}</td>
                <td><span class="customer-name">${p.fullName || p.FullName || p.userName || p.UserName}</span></td>
                <td>#${p.rentalID || p.RentalID}</td>
                <td><span class="badge penalty">Cancellation Fee (25%)</span></td>
                <td>${p.paymentMethod || p.PaymentMethod}</td>
                <td>${new Date(p.createdAt || p.CreatedAt).toLocaleDateString()}</td>
                <td class="text-right">₱${chargeAmt.toLocaleString()}</td>
            </tr>`;
        }).join("");

        // 4. THE PROFESSIONAL WINDOW
        const newWindow = window.open("", "", "width=1100,height=800");
        newWindow.document.write(`
    <html>
    <head>
        <title>JKLM Car Rental - Official Report</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            
            /* Corporate Header */
            .report-header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; }
            .company-info p { margin: 4px 0; font-size: 13px; color: #64748b; }
            .report-title { text-align: right; }
            .report-title h2 { margin: 0; color: #0f172a; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
            .report-title p { margin: 4px 0; font-size: 12px; color: #64748b; }

            /* Table Styling */
            h3 { font-size: 14px; text-transform: uppercase; color: #475569; margin-top: 40px; margin-bottom: 15px; border-left: 4px solid #0f172a; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .customer-name { font-weight: 600; color: #0f172a; }
            .text-right { text-align: right; }
            .badge { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
            .penalty { color: #b91c1c; background: #fee2e2; }

            /* Summary Box */
            .summary-container { margin-top: 40px; display: flex; justify-content: flex-end; }
            .summary-box { width: 300px; background: #f8fafc; padding: 20px; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-weight: 700; font-size: 16px; color: #0f172a; }

            /* Footer */
            .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            
            @media print {
                body { padding: 20px; }
                .summary-box { border: 1px solid #e2e8f0; }
            }
        </style>
    </head>
    <body>
        <div class="report-header">
            <div class="company-info">
                <h1>JKLM CAR RENTAL</h1>
                <p>Professional Fleet Management System</p>
                <p>Cebu, Philippines | +63 900 000 0000</p>
            </div>
            <div class="report-title">
                <h2>Overall Payment Report</h2>
                <p>Reference: REP-${new Date().getTime().toString().slice(-6)}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
        </div>

        <h3>1. Regular Transactions (Full & Partial)</h3>
        <table>
            <thead>
                <tr>
                    <th>Payment ID</th>
                    <th>Customer Name</th>
                    <th>Rental ID</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th class="text-right">Amount Paid</th>
                </tr>
            </thead>
            <tbody>${regularRows || `<tr><td colspan="7" style="text-align:center">No records found</td></tr>`}</tbody>
        </table>

        <h3>2. Cancellation Penalties (25% Revenue)</h3>
        <table>
            <thead>
                <tr>
                    <th>Payment ID</th>
                    <th>Customer Name</th>
                    <th>Rental ID</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th class="text-right">Penalty Fee</th>
                </tr>
            </thead>
            <tbody>${cancelledRows || `<tr><td colspan="7" style="text-align:center">No records found</td></tr>`}</tbody>
        </table>

        <div class="summary-container">
            <div class="summary-box">
                <div class="summary-row">
                    <span>Regular Total:</span>
                    <span>₱${totalReg.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Penalty Total:</span>
                    <span>₱${totalCan.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span>OVERALL REVENUE</span>
                    <span>₱${overallTotal.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This is a computer-generated document and does not require a physical signature.</p>
            <p>&copy; ${new Date().getFullYear()} JKLM Car Rental. All rights reserved.</p>
        </div>
    </body>
    </html>
    `);

        newWindow.document.close();
        setTimeout(() => {
            newWindow.print();
        }, 500);
    };

    const handlePrintMonthly = () => {
        if (!selectedMonth) {
            toast.error("Please select a month first.");
            return;
        }

        const monthlyPayments = payments.filter(p => {
            const date = new Date(p.createdAt || p.CreatedAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const localMonth = `${year}-${month}`;
            return localMonth === selectedMonth;
        });

        const regularPayments = monthlyPayments.filter(p => {
            const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
            return status !== 'rejected' && status !== 'failed' && status !== 'refunded' && status !== 'pending';
        });

        const cancelledPayments = monthlyPayments.filter(p => {
            const status = (p.paymentStatus || p.PaymentStatus || "").toLowerCase();
            const reason = (p.refundReason || p.RefundReason || p.reason || p.Reason || "").toLowerCase();
            return status === 'refunded' && (reason.includes('cancel') || reason.includes('75%'));
        });

        // --- COMPUTATIONS ---
        const totalReg = regularPayments.reduce((sum, p) => sum + (p.amount || p.Amount || 0), 0);
        const totalCan = cancelledPayments.reduce((sum, p) =>
            sum + ((p.amount || p.Amount || p.totalAmount || p.TotalAmount || 0) * 0.25), 0);
        const overallTotal = totalReg + totalCan;

        const [year, month] = selectedMonth.split('-');
        const readableMonth = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        // --- TABLE ROWS GENERATION ---
        const regularRows = regularPayments.map(p => `
        <tr>
            <td>#${p.paymentID || p.PaymentID}</td>
            <td class="customer-cell">${p.fullName || p.FullName || p.userName || p.UserName}</td>
            <td>#${p.rentalID || p.RentalID}</td>
            <td><span class="badge">${(p.paymentType || "Full").toUpperCase()}</span></td>
            <td>${p.paymentMethod || p.PaymentMethod}</td>
            <td>${new Date(p.createdAt || p.CreatedAt).toLocaleDateString()}</td>
            <td class="text-right amount-cell">₱${(p.amount || p.Amount || 0).toLocaleString()}</td>
        </tr>`).join("");

        const cancelledRows = cancelledPayments.map(p => `
        <tr>
            <td>#${p.paymentID || p.PaymentID}</td>
            <td class="customer-cell">${p.fullName || p.FullName || p.userName || p.UserName}</td>
            <td>#${p.rentalID || p.RentalID}</td>
            <td><span class="badge penalty">CANCEL CHARGE (25%)</span></td>
            <td>${p.paymentMethod || p.PaymentMethod}</td>
            <td>${new Date(p.createdAt || p.CreatedAt).toLocaleDateString()}</td>
            <td class="text-right amount-cell">₱${((p.amount || p.totalAmount || 0) * 0.25).toLocaleString()}</td>
        </tr>`).join("");

        // --- PROFESSIONAL PRINT DOCUMENT ---
        const newWindow = window.open("", "", "width=1100,height=800");
        newWindow.document.write(`
    <html>
    <head>
        <title>JKLM Car Rental - Monthly Report</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            
            /* Modern Corporate Header */
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .brand h1 { margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; }
            .brand p { margin: 2px 0; font-size: 13px; color: #64748b; }
            .report-info { text-align: right; }
            .report-info h2 { margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; }
            .report-info p { margin: 4px 0; font-size: 12px; color: #64748b; }

            /* Table Styling */
            section { margin-top: 35px; }
            h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-left: 5px solid #0f172a; padding-left: 12px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f8fafc; color: #475569; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .customer-cell { font-weight: 600; color: #0f172a; }
            .amount-cell { font-weight: 700; font-family: monospace; font-size: 13px; }
            .text-right { text-align: right; }
            .badge { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #475569; }
            .penalty { background: #fee2e2; color: #b91c1c; }

            /* Financial Summary Section */
            .summary-section { margin-top: 50px; display: flex; justify-content: flex-end; }
            .summary-card { width: 320px; background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; }
            .summary-item { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .grand-total { border-top: 2px solid #0f172a; margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; color: #0f172a; }

            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            
            @media print {
                body { padding: 0; }
                .summary-card { border: 1px solid #ccc; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="brand">
                <h1>JKLM CAR RENTAL</h1>
                <p>System-Generated Financial Monthly Report</p>
                <p>Date Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="report-info">
                <h2>Monthly Statement</h2>
                <p style="font-weight: bold; font-size: 16px; color: #0f172a;">${readableMonth}</p>
                <p>Reference: MON-${new Date().getTime().toString().slice(-6)}</p>
            </div>
        </div>

        <section>
            <h3>1. Active & Completed Transactions</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Rental ID</th>
                        <th>Type</th>
                        <th>Method</th>
                        <th>Date</th>
                        <th class="text-right">Net Amount</th>
                    </tr>
                </thead>
                <tbody>${regularRows || '<tr><td colspan="7" style="text-align:center">No transactions recorded</td></tr>'}</tbody>
            </table>
        </section>

        <section>
            <h3>2. Cancellation Fee Revenue (25% Collection)</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Rental ID</th>
                        <th>Description</th>
                        <th>Method</th>
                        <th>Date</th>
                        <th class="text-right">Collection</th>
                    </tr>
                </thead>
                <tbody>${cancelledRows || '<tr><td colspan="7" style="text-align:center">No cancellations recorded</td></tr>'}</tbody>
            </table>
        </section>

        <div class="summary-section">
            <div class="summary-card">
                <div class="summary-item">
                    <span>Regular Subtotal:</span>
                    <span style="font-weight: 600;">₱${totalReg.toLocaleString()}</span>
                </div>
                <div class="summary-item">
                    <span>Penalties Subtotal:</span>
                    <span style="font-weight: 600;">₱${totalCan.toLocaleString()}</span>
                </div>
                <div class="grand-total">
                    <span>TOTAL REVENUE</span>
                    <span>₱${overallTotal.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Confidentially generated by JKLM Admin Terminal. Internal use only.</p>
            <p>&copy; ${new Date().getFullYear()} JKLM Car Rental. All Rights Reserved.</p>
        </div>
    </body>
    </html>
    `);

        newWindow.document.close();
        setTimeout(() => { newWindow.print(); }, 500);
    };

    const handleRefund = async (paymentId) => {
        const reason = window.prompt("Enter reason for refund:");
        if (!reason) return;

        try {
            const response = await fetch(`https://localhost:7263/api/payment/refund/${paymentId}?reason=${encodeURIComponent(reason)}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert("Refund processed successfully!");
                fetchAllPayments();
            } else {
                const data = await response.json();
                alert(`Failed to process refund: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            alert("A network error occurred while processing the refund.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
            case 'Success':
                return 'status-badge status-approved';
            case 'Pending':
                return 'status-badge status-pending';
            case 'Refunded':
            case 'Failed':
                return 'status-badge status-rejected';
            default:
                return 'status-badge status-default';
        }
    };

    // Filter Logic
    const filteredPayments = payments.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        const userName = (p.fullName || p.FullName || "").toLowerCase();
        const pId = (p.paymentID || p.PaymentID || "").toString();
        const rId = (p.rentalID || p.RentalID || "").toString();

        const date = new Date(p.createdAt || p.CreatedAt);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const localMonth = `${year}-${month}`;

        const monthMatch = selectedMonth
            ? localMonth === selectedMonth
            : true;

        return (
            (userName.includes(searchLower) ||
                pId.includes(searchLower) ||
                rId.includes(searchLower)) &&
            monthMatch
        );
    });

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    if (loading && payments.length === 0) return <div className="loading-state">Loading payments...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    return (
        <div className="manage-payment-container">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="page-header">
                <div>
                    <h2 className="page-title">Manage Payments</h2>
                    <p className="page-subtitle">View and manage all customer transactions securely.</p>
                </div>
                <button onClick={() => { fetchAllPayments(); setCurrentPage(1); }} className="btn-primary">
                    <span className="icon">↻</span> Refresh Data
                </button>
            </div>

            <div className="stats-container">
                <div className="stat-box">
                    <h4>Total Revenue</h4>
                    <p className="text-green">₱{totalRevenue.toLocaleString()}</p>
                </div>

                <div className="stat-box">
                    <h4>Total Transactions</h4>
                    <p>{totalTransactions}</p>
                </div>

                <div className="stat-box">
                    <h4>Completed Transactions</h4>
                    <p>{totalCompleted}</p>
                </div>
            </div>

            {/* CONTROLS AREA */}
            <div className="controls-container">
                <div className="left-controls">
                    <input
                        type="text"
                        placeholder="Search by Customer or ID..."
                        className="search-input"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input month-input"
                    />
                </div>
                <div className="right-controls">
                    <button onClick={handleExportCSV} className="btn-secondary">📄 Export CSV</button>
                    <button onClick={handlePrint} className="btn-secondary">🖨️ Print</button>
                    <button onClick={handlePrintMonthly} className="btn-secondary">📅 Print Monthly</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="payment-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Customer</th>
                            <th>Rental ID</th>
                            <th>Date</th>
                            <th>Total Amount</th>
                            <th>Amount Paid</th>
                            <th>Balance</th>
                            <th>Payment Type</th>
                            <th>Status</th>
                            <th>Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="empty-message">
                                    {searchTerm ? "No payments matched your search." : "No payments found."}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((p, index) => {
                                const status = p.paymentStatus || p.PaymentStatus || 'Unknown';
                                const pType = p.paymentType || p.PaymentType || 'Full';
                                const pId = p.paymentID || p.PaymentID;

                                return (
                                    <tr key={pId || index}>
                                        <td className="font-mono text-muted">#{pId}</td>
                                        <td className="font-medium">{p.fullName || p.FullName}</td>
                                        <td className="font-mono">#{p.rentalID || p.RentalID}</td>
                                        <td>
                                            {new Date(p.createdAt || p.CreatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="font-medium">₱{(p.totalAmount || p.TotalAmount || 0).toLocaleString()}</td>
                                        <td className="text-green font-semibold">
                                            ₱{(p.amount || p.Amount || 0).toLocaleString()}
                                        </td>
                                        <td className="font-medium">
                                            {p.balanceDisplay || p.BalanceDisplay || `₱${(p.remainingBalance || p.RemainingBalance || 0).toLocaleString()}`}
                                        </td>
                                        <td>
                                            <span className="type-badge">{pType}</span>
                                        </td>
                                        <td>
                                            <span className={getStatusBadge(status)}>
                                                {status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="method-text">{p.paymentMethod || p.PaymentMethod || 'Online'}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="pagination-btn"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        className="pagination-btn"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default ManagePayment;