import React from 'react';
import sberLogo from "../assets/banks/sber.png";
import tinkoffLogo from "../assets/banks/tinkoff.png";
import alfaLogo from "../assets/banks/alfabank.png";
import otpLogo from "../assets/banks/OTPBank.png";
import rshbLogo from "../assets/banks/rshb.png";
import solidarnostLogo from "../assets/banks/solidarnost.png";

const BankLogo = ({ bankName, style }) => {
  const banks = [
    { name: "СБЕР", logo: sberLogo },
    { name: "ТИНЬКОФФ", logo: tinkoffLogo },
    { name: "АЛЬФА", logo: alfaLogo },
    { name: "ОТП", logo: otpLogo },
    { name: "РСХБ", logo: rshbLogo },
    { name: "СОЛИДАРНОСТЬ", logo: solidarnostLogo },
  ];

  const bank = banks.find(b => b.name === bankName);
  if (!bank) return null;
  
  return (
    <img 
      src={bank.logo} 
      alt={`${bankName} logo`} 
      className="bank-logo"
      style={{ 
        width: '24px',
        height: '24px',
        objectFit: 'contain',
        ...style 
      }}
    />
  );
};

export default BankLogo;