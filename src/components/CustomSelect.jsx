import { useState, useRef, useEffect } from "react";
import BankLogo from "./BankLogo";
import "./css/CustomSelect.css";

const CustomSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(value || "");
  const dropdownRef = useRef(null);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && optionsRef.current) {
      optionsRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <div
        className="custom-select-header"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(!isOpen);
          }
        }}
      >
        {selectedOption ? (
          <>
            <BankLogo bankName={selectedOption} />
            <span>{selectedOption}</span>
          </>
        ) : (
          <span>Выберите банк</span>
        )}
        <span className={`arrow ${isOpen ? "open" : ""}`}>▼</span>
      </div>
      {isOpen && (
        <ul
          className="custom-select-options"
          ref={optionsRef}
          tabIndex="-1"
          onKeyDown={handleKeyDown}
        >
          <div className="custom-select-options-inner">
            {options.map((option) => (
              <li
                key={option.id}
                className="custom-select-option"
                onClick={() => handleSelect(option.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSelect(option.name);
                  }
                }}
                tabIndex="0"
              >
                <BankLogo bankName={option.name} />
                <span>{option.name}</span>
              </li>
            ))}
          </div>
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
