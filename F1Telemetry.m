host = '127.0.0.1';
port = 65432;

% Create TCP/IP client
t = tcpclient(host, port);

disp('Connected to Python server.')

% Read data until connection is closed
while true
    try
        % Wait until data is available
        if t.NumBytesAvailable > 0
            raw = readline(t);  % read one line
            jsonStr = char(raw);
            
            % Parse JSON string into a MATLAB struct
            data = jsondecode(jsonStr);
            
            % Display telemetry
            fprintf('Time: %.1f | RPM: %d | Speed: %.1f | Throttle: %.1f | Brake: %.1f\n', ...
                    data.Time, data.RPM, data.Speed, data.Throttle, data.Brake);
        else
            pause(0.05);  % avoid tight loop
        end
    catch e
        warning("Connection closed or error occurred: %s", e.message);
        break;
    end
end

clear t  % Close connection