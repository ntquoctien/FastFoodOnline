import React from "react";
import "./Footer.css";
import { assets } from "../../assets/frontend_assets/assets";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Trang chu", href: "/" },
    { label: "Thuc don", href: "/menu" },
    { label: "Dat ban", href: "/reservation" },
    { label: "Tin tuc & Khuyen mai", href: "/promotions" },
    { label: "Lien he", href: "/contact" },
  ];

  const socialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "TikTok", href: "https://www.tiktok.com/" },
    { label: "Zalo OA", href: "https://oa.zalo.me/" },
  ];

  const paymentMethods = ["Visa", "Mastercard", "Momo", "ZaloPay"];

  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-section footer-legal">
          <h2>FastFood Online Restaurant</h2>
          <p>
            Chung toi cam ket mang den trai nghiem am thuc chuan xac va minh
            bach, tuan thu day du quy dinh cua phap luat Viet Nam.
          </p>
          <ul className="footer-legal-list">
            <li>
              <strong>Ten nha hang:</strong> FastFood Online Restaurant
            </li>
            <li>
              <strong>Dia chi:</strong> 123 Nguyen Trai, Quan 5, TP. Ho Chi Minh
            </li>
            <li>
              <strong>Dien thoai:</strong>{" "}
              <a href="tel:+842835551234">(+84) 28 3555 1234</a>
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:contact@fastfoodonline.vn">
                contact@fastfoodonline.vn
              </a>
            </li>
            <li>
              <strong>Ma so thue:</strong> 0312345678
            </li>
            <li>
              <strong>Dai dien phap luat:</strong> Nguyen Thi An
            </li>
          </ul>
        </div>

        <div className="footer-section footer-hours">
          <h3>Gio hoat dong & Ban do</h3>
          <p>Gio mo cua: 10:00 - 22:00 (Hang ngay)</p>
          <a
            href="https://maps.google.com/?q=FastFood+Online+Restaurant"
            target="_blank"
            rel="noopener noreferrer"
          >
            Xem ban do
          </a>
        </div>

        <div className="footer-section footer-links">
          <h3>Lien ket nhanh</h3>
          <ul className="footer-links-list">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-section footer-social">
          <h3>Mang xa hoi</h3>
          <div className="footer-social-links">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-section footer-newsletter">
          <h3>Dang ky nhan uu dai</h3>
          <p>
            Nhan thong tin mon moi, su kien va uu dai doc quyen danh rieng cho
            khach hang than thiet.
          </p>
          <form
            className="footer-newsletter-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              placeholder="Nhap email cua ban"
              aria-label="Email nhan uu dai"
              required
            />
            <button type="submit">Dang ky</button>
          </form>
        </div>

        <div className="footer-section footer-certifications">
          <h3>Chung nhan & Thanh toan</h3>
          <img
            src={assets.bocongthuong}
            alt="Logo da dang ky Bo Cong Thuong"
            className="footer-certification-image"
          />
          <ul className="footer-payment-list">
            {paymentMethods.map((method) => (
              <li key={method}>{method}</li>
            ))}
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        {"\u00A9"} {currentYear} FastFood Online. All rights reserved.
      </p>
      <p className="footer-credit">
        Thiet ke & van hanh boi FastFood Online Team.
      </p>
    </div>
  );
};

export default Footer;
