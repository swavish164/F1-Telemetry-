host = '127.0.0.1';
port = 65432;

% Create TCP/IP client
t = tcpclient(host, port);

disp('Connected to Python server.');

x = 0; x2 = 0; x3 = 0;
y = 0; y2 = 0; y3 = 0;

while true
    try
        if t.NumBytesAvailable > 0
            raw = readline(t); 
            jsonStr = char(raw);
            
            data = jsondecode(jsonStr);
            Time = data.Time;
            rpm = data.RPM;
            speed = data.Speed;
            throttle = data.Throttle;
            brake = data.Brake;
            weather = data.Weather;
            posData = data.PosData; 
            
            if y2 == 0
                y2 = y;
                x2 = x;
            else
                y3 = y2;
                x3 = x2;
                y2 = y;
                x2 = x;
            end

            x = posData(1); 
            y = posData(2);

          s
            if y3 ~= 0
                gf = gforce(x, x2, x3, y, y2, y3, speed);
                fprintf('G-Force: %.2f g\n', gf);
            end
        else
            pause(0.05); 
        end
    catch e
        warning("Connection closed or error occurred: %s", e.message);
        break;
    end
end

clear t 

function gf = gforce(x1, x2, x3, y1, y2, y3, speed)
    A = [x1, y1, 1;
         x2, y2, 1;
         x3, y3, 1];
    B = [-(x1^2 + y1^2);
         -(x2^2 + y2^2);
         -(x3^2 + y3^2)];
    try
        sol = A\B;
        a = sol(1); b = sol(2); c = sol(3);
        r = sqrt((a^2 + b^2)/4 - c);
    catch
        r = NaN;
    end

    gf = (speed^2 / r) / 9.8;
end
