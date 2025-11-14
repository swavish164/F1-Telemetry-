host = '127.0.0.1';
port = 65432;

% Create TCP/IP client
t = tcpclient(host, port);

disp('Connected to Python server.');

x = 0; x2 = 0; x3 = 0;
y = 0; y2 = 0; y3 = 0;
baseWear = 1e-4;
temps = [90,105,105,65,50];
averageLoss = [(90/(25*90)),(90/(35*90)),(90/(45*90)),(90/(60*90)),(90/(50*90))];
%for different tyres (soft,medium,hard,intermediate,wet)
tempMult = 0.05;
vBase = 300;
velMult = 0.01;
pMult = 0.02;
wMult = 0.02;
currentTyreWear = [100, 100, 100, 100];

tyreCompound = '';
baseMass = 800;
heightCentreG = 0.3;
wheelBase = 3.6;
trackWidth = 1.6;
weather = [];
tyreNumber = 0;
loss = 0;
optimalTemp = 0;
airTemp = 0;
pressure = 0;
trackTemp = 0;
windSpeed = 0;
speed2 = 0;
t2 = 0;


while true
    try
        if t.NumBytesAvailable > 0
            raw = readline(t); 
            jsonStr = char(raw);
            packet = jsondecode(jsonStr);
            
            if isfield(packet, 'type')
                if strcmp(packet.type, 'initial')
                   data = packet.data;
                   tyreCompound = data.tyreCompound;
                   weather = data.weather;
                   tyreNumber = tyreTypeAssignee(tyreCompound);
                   loss = averageLoss(tyreNumber);
                   optimalTemp = temps(tyreNumber);
                   airTemp = data.weather(1);
                   pressure = data.weather(3);
                   trackTemp = data.weather(5);
                   windSpeed = data.weather(7);

                elseif strcmp(packet.type, 'update')
                    data = packet.data;
                    Time = data.Time;
                    rpm = data.RPM;
                    gear = data.Gear;
                    speed = data.Speed;
                    throttle = data.Throttle;
                    brake = data.Brake;
                    posData = data.PosData; 
                    drs = data.DRS;
                    
                    if y~=0 && y2~=0
                        y3 = y2;
                        x3 = x2;
                        y2 = y;
                        x2 = x;
                        t2 = t1;
                        speed2 = speed1;
                    else
                        if y2 == 0 && y ~= 0
                            y2 = y;
                            x2 = x;
                        end
                    end

                    x = posData(1); 
                    y = posData(2);
                    speed1 = speed;
                    t1 = Time;

                    gf = NaN;
                    angle_deg = NaN;

                    if y3 ~= 0
                        [gf,angle_deg,xCentre,yCentre] = gforce(x, x2, x3, y, y2, y3, speed);
                        section = angle_deg / 36;
                        data.Gforce = gf;
                        data.GforceAngle = angle_deg;
                        
                        temp = calculateTemp(trackTemp, optimalTemp, tempMult);
                        speedMult = calculateSpeedMult(speed, vBase, velMult);
                        pressureMult = calculatePressureMult(pressure, pMult);
                        windMult = calculateWindMult(windSpeed, wMult);

                        velocityX = x - x2;
                        velocityY = y - y2;
                        vecX = xCentre - x2;
                        vecY = yCentre - y2;
                        directionSign = sign(velocityX * vecY - velocityY * vecX);
                        latA = gf * 9.81 * directionSign;
                        if brake
                          longA = -8.0;               
                        else
                            longA = (throttle/100) * 1.5;
                        end
                        
                        currentTyreWear = tyreWear(currentTyreWear,speed1, speed2, t1, t2, loss, temp, gf, speedMult, windMult, pressureMult,longA,latA,baseMass,wheelBase,trackWidth,heightCentreG);
                        data.TyreWear = repmat(round(currentTyreWear, 3), 1, 4);
                        data.TyreCompound = tyreCompound;

                    else
                        data.Gforce = NaN;
                        data.GforceAngle = NaN;
                        data.currentTyreWear = NaN;
                    end
                    
                    packet_out = struct("type","update",...
                            "data",data);
                    jsonStrOut = jsonencode(packet_out);
                    write(t, uint8([jsonStrOut newline]));

                    x_prev = x;
                    y_prev = y;
                end
            else
                pause(0.05); 
            end
        else
            pause(0.05);
        end
    catch e
    fprintf(2, '\n Error\n');
    fprintf(2, 'Message: %s\n', e.message);
    if ~isempty(e.stack)
        fprintf(2, 'File: %s\n', e.stack(1).file);
        fprintf(2, 'Function: %s\n', e.stack(1).name);
        fprintf(2, 'Line: %d\n', e.stack(1).line);
        fprintf(2, '--- Full stack trace ---\n');
        for s = 1:numel(e.stack)
            fprintf(2, '  %d) %s (line %d)\n', s, e.stack(s).file, e.stack(s).line);
        end
    end
    fprintf(2, '--------------------------\n\n');
    break;
end
end

clear t 

function [gf,angle_deg,xCentre,yCentre] = gforce(x1, x2, x3, y1, y2, y3, speed)
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
        xCentre = -a/2; yCentre = -b/2; 
    catch
        r = NaN;
        xCentre = NaN;
        yCentre = NaN;
    end
    
    if ~isnan(r) && r ~= 0
        gf = (speed^2 / r) / 9.8;
        dx = x2 - xCentre;
        dy = y2 - yCentre;
        angle_deg = rad2deg(atan2(dy, dx));
    else
        gf = NaN;
        angle_deg = NaN;
        xCentre = NaN;
        yCentre = NaN;

    end
end

function currentWear = tyreWear(tyres,speed1, speed2, t1, t2, loss, temp, gf, speedMult, windMult, pressureMult,longA,latA,baseMass,wheelBase,trackWidth,heightCentreG)
    loadTranserLong = (baseMass * longA * heightCentreG) / wheelBase;
    loadTranserLat = (baseMass * latA * heightCentreG) / trackWidth;

    if t2 == t1
        dt = 0.01;
    else
        dt = t2 - t1;
    end
    
    if dt == 0
        dSpeed = 0;
    else
        dSpeed = (speed2 - speed1) / dt;
    end

    if isnan(gf)
        gf = 1;
    end
    
    wear = loss * temp * (gf)^1.3 * speedMult * windMult * pressureMult * dt;

    weight = baseMass * 9.81;
    tyreBase = weight / 4;
    frontLeft = tyreBase - 0.5*loadTranserLong - 0.5*loadTranserLat;
    frontRight = tyreBase - 0.5*loadTranserLong + 0.5*loadTranserLat;
    rearLeft = tyreBase + 0.5*loadTranserLong - 0.5*loadTranserLat;
    rearRight = tyreBase + 0.5*loadTranserLong + 0.5*loadTranserLat;
    wheelLoads = [frontLeft, frontRight, rearLeft, rearRight];
    wheelLoads(wheelLoads< 1) = 1;
    loadFactors = wheelLoads ./ tyreBase;
    tyreWears = wear .* loadFactors;


    currentWear = tyres + tyreWears;
end

function temp = calculateTemp(trackTemp, optimalTemp, tempMult)
    if iscell(trackTemp), trackTemp = cell2mat(trackTemp); end
    if iscell(optimalTemp), optimalTemp = cell2mat(optimalTemp); end
    diff = abs(trackTemp - optimalTemp);
    temp = 1 + tempMult * (diff / optimalTemp);
end

function speedMult = calculateSpeedMult(speed, vBase, velMult)
    ratio = speed / vBase;
    speedMult = 1 + velMult * ratio;
end

function pressureMult = calculatePressureMult(pressure, pMult)
    if iscell(pressure), pressure = cell2mat(pressure); end
    ratio = (pressure - 1013) / 1013;
    pressureMult = 1 - pMult * ratio;
end

function windMult = calculateWindMult(windSpeed, wMult)
    if iscell(windSpeed), windSpeed = cell2mat(windSpeed); end
    ratio = windSpeed / 100;
    windMult = 1 - wMult * ratio;
end

function [longForce,latForce] = longLatComponent(gf,throttle,brake,angle)
    longForce = (throttle/100)*1.5;
    if brake
        longForce = -8.0;
    end
    latForce = gf * 9.81 * sind(angle);
end

function tyreNumber = tyreTypeAssignee(compound)
    switch compound
        case 'SOFT'
            tyreNumber = 1;
        case 'MEDIUM'
            tyreNumber = 2;
        case 'HARD'
            tyreNumber = 3;
        case 'INTERMEDIATE'
            tyreNumber = 4;
        otherwise
            tyreNumber = 5;
    end
end