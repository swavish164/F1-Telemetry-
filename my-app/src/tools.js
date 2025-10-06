export function throttleBar({throttle}) {
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


export function drsBool({DRS}){
  if(DRS < 8){
    return false
  }
  else{
    return true 
  }
} 

export function parseSectorInput(input) {
  const parts = input
    .split(/[,\s]+/) // split by comma or whitespace
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));

  if (parts.length !== 3) {
    return { valid: false, data: [] };
  }

  return { valid: true, data: parts };
}

