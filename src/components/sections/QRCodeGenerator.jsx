import React from "react";
import { QRCodeSVG } from "qrcode.react";

const QRCodeGenerator = ({ bookingData }) => {
  if (!bookingData) return null;

  const qrCodeData = JSON.stringify({
    reserverId: bookingData.RESERVERID,
    roomCode: bookingData.CFRNUM,
    date: bookingData.BDATE,
    startTime: bookingData.STARTTIME,
    endTime: bookingData.ENDTIME,
  });

  return (
    <div className="mt-6 text-center">
      <h3 className="text-lg font-semibold mb-2">QR Code สำหรับการจอง</h3>
      <div className="inline-block p-4 bg-white rounded-lg shadow-md">
        <QRCodeSVG value={qrCodeData} size={200} />
      </div>
      <p className="mt-2 text-sm text-gray-600">
        สแกน QR Code นี้เพื่อเข้าใช้ห้องประชุม
      </p>
    </div>
  );
};

export default QRCodeGenerator;
