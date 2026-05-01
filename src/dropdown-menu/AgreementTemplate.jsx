export const generateAgreementHTML = (rental, user) => {
    const startDate = new Date(rental.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const endDate = new Date(rental.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const balance = rental.totalPrice / 2; 

    return `
        <html>
        <head>
            <title>Rental Agreement - #${rental.rentalID}</title>
            <style>
                @page { size: auto; margin: 15mm; }
                body { 
                    font-family: 'Arial', sans-serif; 
                    color: #000; 
                    line-height: 1.6; 
                    padding: 20px; 
                    max-width: 800px; 
                    margin: auto; 
                }
                
                /* 🟢 NEW BRAND DESIGN BASE SA IMONG PICTURE */
                .brand-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .brand-text {
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                }
                .brand { 
                    font-size: 38px; 
                    font-weight: 900; 
                    letter-spacing: 1px; 
                    margin: 0; 
                    line-height: 1;
                    font-family: 'Arial', sans-serif;
                }
                .sub-brand { 
                    font-size: 15px; 
                    letter-spacing: 6px; 
                    color: #000; 
                    font-weight: bold;
                    margin-top: 4px;
                }
                /* END BRAND DESIGN */

                .header-details { 
                    text-align: center; 
                    border-bottom: 4px double #000; 
                    padding-bottom: 15px; 
                    margin-bottom: 30px; 
                }
                .doc-title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
                .ref-no { font-size: 14px; margin-top: 5px; color: #444; }
                
                .section { margin-bottom: 25px; }
                .section-title { 
                    font-size: 14px; 
                    font-weight: bold; 
                    text-transform: uppercase;
                    background: #f0f0f0; 
                    padding: 6px 10px; 
                    border-left: 3px solid #000; 
                    margin-bottom: 15px; 
                    font-family: 'Arial', sans-serif;
                }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: 'Arial', sans-serif; font-size: 13px; }
                th, td { padding: 8px 12px; border: 1px solid #000; text-align: left; }
                th { background-color: #fafafa; width: 40%; }
                
                .terms-box { border: 1px solid #000; padding: 15px; margin-top: 20px; }
                .terms { font-size: 12px; text-align: justify; margin: 0; padding-left: 20px; }
                .terms li { margin-bottom: 8px; }
                
                .signatures { display: flex; justify-content: space-between; margin-top: 60px; font-family: 'Arial', sans-serif; }
                .sign-box { width: 40%; text-align: center; }
                .sign-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-weight: bold; font-size: 13px; }
                .date-line { border-bottom: 1px solid #000; display: inline-block; width: 100px; margin-left: 10px; }
            </style>
        </head>
        <body>
            <div class="brand-container">
                <svg width="55" height="55" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.69 2 6 4.69 6 8.5c0 4.5 6 11.5 6 11.5s6-7 6-11.5C18 4.69 15.31 2 12 2z" fill="#000"/>
                    <path d="M9.5 8.5l1.5 1.5 3-3" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                
                <div class="brand-text">
                    <div class="brand">JKLM</div>
                    <div class="sub-brand">Car Rental</div>
                </div>
            </div>

            <div class="header-details">
                <div class="doc-title">Vehicle Rental Agreement</div>
                <div class="ref-no">Reference No: <strong>#${rental.rentalID}</strong></div>
            </div>

            <div class="section">
                <div class="section-title">1. Renter & Vehicle Information</div>
                <table>
                    <tr><th>Customer Name</th><td>${rental.fullName}</td></tr>
                    <tr><th>Contact Email</th><td>${user.email || 'N/A'}</td></tr>
                    <tr><th>Contact Number</th><td>${rental.contactNumber}</td></tr>
                    <tr><th>Vehicle Model / Name</th><td><strong>${rental.carName}</strong></td></tr>
                    <tr><th>Pick-up Location</th><td>${rental.pickupLocation || 'Cebu City, Philippines'}</td></tr>
                    <tr><th>Rental Period</th><td>${startDate} &nbsp; <strong>to</strong> &nbsp; ${endDate}</td></tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">2. Payment Summary</div>
                <table>
                    <tr><th>Total Rental Fee</th><td>₱${rental.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
                    <tr><th>Downpayment (Paid Online)</th><td>₱${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
                    <tr><th>Remaining Balance (Due On-Site)</th><td style="font-size: 16px;"><strong>₱${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
                </table>
            </div>

            <div class="section terms-box">
                <div class="section-title" style="border: none; background: transparent; padding: 0; margin-bottom: 10px;">3. Terms, Conditions & Liabilities</div>
                <ul class="terms">
                <li style="color: #d32f2f;"><strong>STRICT PICK-UP REQUIREMENT:</strong> The renter MUST present a physical photocopy of their <strong>Driver's License</strong> and <strong>Birth Certificate</strong> upon claiming the vehicle. The keys will not be handed over without these documents.</li>
                    <li><strong>Payment:</strong> The renter agrees to pay the Remaining Balance in full upon pick-up.</li>
                    <li><strong>Payment:</strong> The renter agrees to pay the Remaining Balance in full upon pick-up of the vehicle. Keys will not be handed over until the balance is settled.</li>
                    <li><strong>Vehicle Condition:</strong> The renter accepts the vehicle in its current condition and agrees to return it in the exact same condition, normal wear and tear excepted.</li>
                    <li><strong>Damages & Penalties:</strong> The renter assumes full financial responsibility for any damages, scratches, dents, or accidents that occur during the rental period.</li>
                    <li><strong>Late Returns:</strong> A strict penalty fee will be applied for every day the vehicle is returned past the agreed Drop-off date without prior management approval.</li>
                    <li><strong>Usage:</strong> The vehicle must only be driven by the authorized renter and within the permitted geographical boundaries.</li>
                </ul>
            </div>

            <div class="signatures">
                <div class="sign-box">
                    <div class="sign-line">${rental.fullName}</div>
                    <div style="font-size: 11px; margin-top: 3px;">Renter's Signature over Printed Name</div>
                    <div style="margin-top: 10px; font-size: 12px; text-align: left;">Date: <span class="date-line"></span></div>
                </div>
                <div class="sign-box">
                    <div class="sign-line">Authorized Representative</div>
                    <div style="font-size: 11px; margin-top: 3px;">CAR RENTAL CEBU CITY</div>
                    <div style="margin-top: 10px; font-size: 12px; text-align: left;">Date: <span class="date-line"></span></div>
                </div>
            </div>

            <script>
                setTimeout(() => { window.print(); }, 800);
            </script>
        </body>
        </html>
    `;
};