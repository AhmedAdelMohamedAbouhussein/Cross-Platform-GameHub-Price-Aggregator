function Dropdown({ options = [], value, onChange, label }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    {label}
                </label>
            )}
            <select
                className="select-field"
                value={value}
                onChange={onChange}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default Dropdown;
