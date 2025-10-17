export function ThrottleBar({throttle}) {
  return (
    <div style={{
      width: "100%",
      height: "100%",
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


export function DRSBool({DRS}){
  if(DRS <= 8){
    return false
  }
  else{
    return true 
  }
} 

export function ParseSectorInput(input) {
  const parts = input
    .split(/[,\s]+/) // split by comma or whitespace
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));

  if (parts.length !== 3) {
    return { valid: false, data: [] };
  }

  return { valid: true, data: parts };
}

export function CalculateSectorColour(time,delta,expected){
  if(time >= expected){
    return "purple";
  }else if(time >= expected){
    return "green";
  }else{
    return "red";
  };
};

export function GetCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

