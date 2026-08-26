export default function HamburgerButton({ isOpen, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      className={`flex flex-col justify-center items-center w-9 h-9 gap-[5px] focus:outline-none ${className}`}
    >
      <span
        className={`block h-0.5 w-6 bg-current rounded-full origin-center transition-all duration-300 ease-in-out ${
          isOpen ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-0 scale-x-0" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-6 bg-current rounded-full origin-center transition-all duration-300 ease-in-out ${
          isOpen ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </button>
  )
}
