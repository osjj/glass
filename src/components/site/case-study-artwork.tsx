// Original editorial diagram, not a photograph or a reproduction of a supplied product.
export function CaseStudyArtwork() {
  return (
    <figure className="overflow-hidden rounded-2xl bg-[#edf0f4]">
      <div className="flex items-center justify-between gap-4 px-6 pt-6 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#536274] sm:px-10 sm:pt-9">
        <span>Color · Identity · Packaging</span>
        <span>Study 01</span>
      </div>
      <svg viewBox="0 0 760 380" className="block h-auto w-full" role="img" aria-label="Conceptual illustration of three differently colored tumblers, representing a glassware selection brief">
        <ellipse cx="380" cy="320" rx="272" ry="20" fill="#132d50" opacity="0.06" />
        {[
          { x: 146, color: "#a395bf" },
          { x: 320, color: "#8d9a71" },
          { x: 494, color: "#8caec0" },
        ].map(({ x, color }) => (
          <g key={x} transform={`translate(${x} 64)`}>
            <path d="M0 36 Q60 8 120 36 L106 238 Q60 261 14 238 Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
            <ellipse cx="60" cy="36" rx="60" ry="15" fill="white" fillOpacity="0.45" stroke={color} strokeWidth="2" />
            <path d="M18 59 L27 226 M28 62 L36 229" stroke="white" strokeWidth="4" opacity="0.6" />
            <path d="M17 235 Q60 250 103 235" fill="none" stroke={color} strokeWidth="6" opacity="0.6" />
            <path d="M88 60 L79 225" stroke={color} strokeWidth="2" opacity="0.35" />
            <circle cx="60" cy="145" r="18" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
            <path d="M53 145 L60 138 L67 145 L60 152 Z" fill="white" opacity="0.6" />
          </g>
        ))}
      </svg>
      <figcaption className="border-t border-[#132d50]/10 px-6 py-4 text-xs leading-5 text-[#536274] sm:px-10">
        Editorial illustration, not project photography. Colors and shapes are illustrative.
      </figcaption>
    </figure>
  );
}
