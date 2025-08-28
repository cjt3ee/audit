@echo off
echo Starting Audit Consumer Service...
echo.
echo Make sure Kafka is running before starting the consumer!
echo.
pause

cd /D C:\D\proj\audit\consumer
mvn spring-boot:run