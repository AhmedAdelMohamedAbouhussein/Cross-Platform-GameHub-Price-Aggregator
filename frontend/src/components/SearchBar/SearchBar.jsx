import { FiSearch } from "react-icons/fi";

function SearchBar({ value, onChange, placeholder = "Search..." }) {
    return (
        <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
                type="text"
                className="input-field pl-10"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

export default SearchBar;
