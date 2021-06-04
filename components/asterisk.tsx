interface Props {
  size?: number;
}

const Asterisk: React.FC<Props> = (props) => (
  <svg
    width={20}
    height={32}
    viewBox="0 0 20 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      style={{
        mixBlendMode: "exclusion",
      }}
      fill="#fff"
    >
      <circle cx={4} cy={28} r={4} />
      <circle cx={4} cy={4} r={4} />
      <circle cx={16} cy={16} r={4} />
      <circle cx={4} cy={16} r={4} />
    </g>
  </svg>
);

export default Asterisk;
