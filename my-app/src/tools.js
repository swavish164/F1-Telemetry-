function throttleBar({throttle}) {
  return (
    <div style={{
      width: "30px",
      height: "200px",
      background: "black",
      borderRadius: "10px",
      display: "flex",
      alignItems: "flex-end"
    }}>
      <div style={{
        width: "100%",
        height: `${throttle}%`,
        background: "green",
        transition: "height 0.2s ease"
      }} />
    </div>
  );
}

export default throttleBar;