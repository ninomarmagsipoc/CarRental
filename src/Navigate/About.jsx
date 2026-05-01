import React from 'react';
import '../Css/About.css';

function About() {
    return (
        <div className="about-page-wrapper">
            <section className="about-hero">
                <div className="hero-content">
                    <h1 className="about-title">About Our Car Rental</h1>
                    <p className="about-subtitle">Premium Service. Seamless Journeys. Since 2026.</p>
                </div>
            </section>

            {/* Content Sections */}
            <div className="about-content-container">
                <section className="about-main-text">
                    <h2>Drive with Confidence</h2>
                    <p>
                        Welcome to our premier Car Rental service, where your journey is our priority. 
                        We started with a simple idea: to provide a hassle-free, transparent, and luxury 
                        car rental experience for everyone. Whether you're traveling for business or 
                        exploring the city, we have the perfect ride for you.
                    </p>
                </section>

                <hr className="divider" />

                <div className="about-grid">
                    <div className="about-card">
                        <h3>Our Mission</h3>
                        <p>To provide reliable and high-quality vehicles that empower our customers to travel with freedom and style.</p>
                    </div>
                    <div className="about-card">
                        <h3>Our Vision</h3>
                        <p>To be the leading car rental platform known for innovation, exceptional customer service, and a diverse fleet.</p>
                    </div>
                    <div className="about-card">
                        <h3>Core Values</h3>
                        <p>Integrity, transparency, and safety. We believe in honest pricing and vehicles that are maintained to the highest standards.</p>
                    </div>
                </div>

                <hr className="divider" />

                <section className="about-why-us">
                    <h2>Why Choose Us?</h2>
                    <ul className="why-us-list">
                        <li>
                            <strong>Wide Fleet Selection</strong> — From budget-friendly sedans to luxury SUVs.
                        </li>
                        <li>
                            <strong>Secure Payments</strong> — Integrated with PayMongo for safe and fast transactions.
                        </li>
                        <li>
                            <strong>24/7 Support</strong> — Our team is always ready to assist you on the road.
                        </li>
                        <li>
                            <strong>Transparent Pricing</strong> — No hidden fees. What you see is what you pay.
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default About;