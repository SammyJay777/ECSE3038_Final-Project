#include <Arduino.h>
#include <Wire.h>
#define Temp_Sensor A7

//Gyroscope variables
int gy_x, gy_y, gy_z;
long gy_x_cal, gy_y_cal, gy_z_cal;
boolean set_gyro_angles;
//Accelerometer variables
long acc_x, acc_y, acc_z, acc_vectorsum;
float acc_rollangle, acc_pitchangle;

float angle_pitch, angle_roll;
int angle_pitch_buffer, angle_roll_buffer;
float angle_pitch_output, angle_roll_output;
int temp, toff;
//double t, tx;

//time
unsigned long current_t;
unsigned long last_t = 0;
unsigned long delayt = 10000;

//Declaring functions
void setup_mpu_6050_registers();
void read_mpu_6050_data();

// esp-01 variables
String ssid = "MonaConnect-iTest";
String password = "";
String host = "10.22.5.86";
String mac = "";
String PORT = "3000";
String Command  = "";
String post = "";
String body = "";
int Truecmd;
int Timecmd; 
int Check = 0;

unsigned char wifi = 0;  

void setup()
{
  Serial.begin(9600);
  
  // setup LM35DT
  pinMode(Temp_Sensor, INPUT);
  
  // setup gyroscope
  Wire.begin();               //Start I2C as master
  setup_mpu_6050_registers(); //Setup the registers of the MPU-6050
  
  for (int cal_int = 0; cal_int < 1000; cal_int++)
  { //Read the raw acc and gyro data from the MPU-6050 for 1000 times
    read_mpu_6050_data();
    gy_x_cal += gy_x; //Add the gyro x offset to the gy_x_cal variable
    gy_y_cal += gy_y; //Add the gyro y offset to the gy_y_cal variable
    gy_z_cal += gy_z; //Add the gyro z offset to the gy_z_cal variable
    delay(3);         //Delay 3us to have 250Hz for-loop
  }

  // divide by 1000 to get avarage offset
  gy_x_cal /= 1000;
  gy_y_cal /= 1000;
  gy_z_cal /= 1000;
  toff = -1600;
}

void loop()
{
  current_t = millis();
  read_mpu_6050_data();
  //Subtract the offset values from the raw gyro values
  gy_x -= gy_x_cal;
  gy_y -= gy_y_cal;
  gy_z -= gy_z_cal;

  //Gyro angle calculations . Note 0.0000611 = 1 / (250Hz x 65.5)
  angle_pitch += gy_x * 0.0000611; //Calculate the traveled pitch angle and add this to the angle_pitch variable
  angle_roll += gy_y * 0.0000611;  //Calculate the traveled roll angle and add this to the angle_roll variable
  angle_pitch += angle_roll * sin(gy_z * 0.000001066); //If the IMU has yawed transfer the roll angle to the pitch angel
  angle_roll -= angle_pitch * sin(gy_z * 0.000001066); //If the IMU has yawed transfer the pitch angle to the roll angel

  //Accelerometer angle calculations
  acc_vectorsum = sqrt((acc_x * acc_x) + (acc_y * acc_y) + (acc_z * acc_z)); //Calculate the total accelerometer vector
  acc_pitchangle = asin((float)acc_y / acc_vectorsum) * 57.296; //Calculate the pitch angle
  acc_rollangle = asin((float)acc_x / acc_vectorsum) * -57.296; //Calculate the roll angle

  acc_pitchangle -= 0.0; //Accelerometer calibration value for pitch
  acc_rollangle -= 0.0;  //Accelerometer calibration value for roll

  if (set_gyro_angles)
  {                                                                //If the IMU is already started
    angle_pitch = angle_pitch * 0.9996 + acc_pitchangle * 0.0004; //Correct the drift of the gyro pitch angle with the accelerometer pitch angle
    angle_roll = angle_roll * 0.9996 + acc_rollangle * 0.0004;    //Correct the drift of the gyro roll angle with the accelerometer roll angle
  }
  else
  {                                //At first start
    angle_pitch = acc_pitchangle; //Set the gyro pitch angle equal to the accelerometer pitch angle
    angle_roll = acc_rollangle;   //Set the gyro roll angle equal to the accelerometer roll angle
    set_gyro_angles = true;        //Set the IMU started flag
  }


  angle_pitch_output = angle_pitch_output * 0.9 + angle_pitch * 0.1; 
  angle_roll_output = angle_roll_output * 0.9 + angle_roll * 0.1;    

}

void setup_mpu_6050_registers()
{
  //Activate the MPU-6050
  Wire.beginTransmission(0x68); //Start communicating with the MPU-6050
  Wire.write(0x6B);             //Send the requested starting register
  Wire.write(0x00);             //Set the requested starting register
  Wire.endTransmission();
  //Configure the accelerometer (+/-8g)
  Wire.beginTransmission(0x68); //Start communicating with the MPU-6050
  Wire.write(0x1C);             //Send the requested starting register
  Wire.write(0x10);             //Set the requested starting register
  Wire.endTransmission();
  //Configure the gyro (500dps full scale)
  Wire.beginTransmission(0x68); //Start communicating with the MPU-6050
  Wire.write(0x1B);             //Send the requested starting register
  Wire.write(0x08);             //Set the requested starting register
  Wire.endTransmission();
}

void read_mpu_6050_data()
{                               //Subroutine for reading the raw gyro and accelerometer data
  Wire.beginTransmission(0x68); //Start communicating with the MPU-6050
  Wire.write(0x3B);             //Send the requested starting register
  Wire.endTransmission();       //End the transmission
  Wire.requestFrom(0x68, 14);   //Request 14 bytes from the MPU-6050
  while (Wire.available() < 14)
    ; //Wait until all the bytes are received
  acc_x = Wire.read() << 8 | Wire.read();
  acc_y = Wire.read() << 8 | Wire.read();
  acc_z = Wire.read() << 8 | Wire.read();
  temp = (Wire.read() << 8 | Wire.read()) + toff;
  gy_x = Wire.read() << 8 | Wire.read();
  gy_y = Wire.read() << 8 | Wire.read();
  gy_z = Wire.read() << 8 | Wire.read();
  tx = temp;
  t = tx / 340 + 36.53;
}


int myRound (float temp)
{
  boolean neg;
  if (temp < 0)
  {
     temp = abs(temp);
     neg = true;
  }
  else
  {
    neg = false;
  }
  float dp = temp - (int)temp;
  if (dp >= 0.5) 
  {
    if (neg) return ((int)temp+1)*(-1);
    else return (int)temp+1;
  }
  else 
  {
    if(neg) return ((int) temp)*(-1);
    else return (int) temp;
  }
}

float Temperature()
{
  int ADCin = analogRead(Temp_Sensor);
  return ((ADCin/1024.0)*5)/0.01;
}


int sendCommand(String command, int fullTime, char read[]) 
{
  Serial.flush();
  Serial.print(Truecmd);
  // program gets stuck here after it is eligible to send data
  Serial.print(". at command => ");
  Serial.print(command);
  Serial.print(" ");
  Check = 0;
  while(Timecmd < (fullTime*1))
  {
    Serial2.println(command); 
    if(Serial2.find(read))//ok
    {
      Check = 1;
      break;
    }
  
    Timecmd++;
  }
  
  if(Check == 1)
  {
    Serial.println("OK");
    Truecmd++;
    Timecmd = 0;
  }
  
  if(Check == 0)
  {
    Serial.println("Fail");
    Truecmd = 0;
    Timecmd = 0;
  }
  

  return Check;
 }
 
void espSetup()
{
  Serial2.begin(115200);
  sendCommand("AT",5,"OK"); // check if connection is okay
  sendCommand("AT+CWMODE=1",5,"OK"); // set client mode
  if(sendCommand("AT+CWJAP=\""+ ssid +"\",\""+ password +"\"",20,"OK")) wifi = 1;
  else wifi = 0;

}

void sendPost() 
{
    sendCommand("AT+CIPSTART=\"TCP\",\""+ host +"\"," + PORT,15,"OK");
    body="";
    body+= "{";
    body += "\"patient_id\":"+mac+",";
    body+= "\"position\":"+ String(myRound(angle_pitch_output)) +",";
    body+= "\"temperature\":"+String(myRound(Temperature()));
    body+= "}";
    post="";
    post = "POST /api/record HTTP/1.1\r\nHost: ";
    post += host;
    post += "\r\nContent-Type: application/json\r\nContent-Length:";
    post += body.length();
    post += "\r\n\r\n";
    post += body;
    post += "\r\n";
    Command = "AT+CIPSEND=";
    Command+= String(post.length());
    sendCommand(Command, 10, "OK");
    sendCommand(post, 15,"OK");
    sendCommand("AT+CIPCLOSE=0", 10, "OK");
}


String getMacAddress()
 {
    
    Serial2.println("AT+CIPSTAMAC?");
    int Serialin =  Serial2.available();
    char response1[Serialin];
    String response = "";
    String mac = "";
    for (int x = 0; x <Serialin; x++)
    {
      response1[x] = Serial2.read();
      response+= response1[x];
    }
    
    int x = response.indexOf('"');
    int from = x+1;
    
    for(int i = x; i < (response.indexOf('"', from))+1; i++)
    {
    mac += response1[i];
    }
    delay(400);
    return mac;
 }
