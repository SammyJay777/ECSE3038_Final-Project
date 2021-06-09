## Overview

In this project, you'll be working to build a prototype for a low cost patient monitoring system. This project is made up of a software and a hardware component.

## Hardware

Patients using this system should be outfitted with a module that should be designed to monitor and report on at least two parameters of the patient. Those two parameters are body temperature and positional orientation.

###Embedded

Students should employ the use of a Gyroscope/Accelerometer sensor like the MPU-6050 and a temperature sensor like the TMP36, the DHT11 or the LM35.

On the embedded side, you should design a sketch that makes your microcontroller send POST requests with the values measured from the gyroscope/accelerometer sensor and the temperature sensor.

send that to the server from your the microcontroller at least every 10 seconds.

POST /api/record

```json
 // Request
 {
     "patient_id": <esp_mac_address>,
     "position": <gyro_value>,
     "temperature": <temp_value>
 }
```# ECSE3038_Final-Project

