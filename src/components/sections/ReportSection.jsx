import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const chartVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.3 },
  },
};

const ReportSection = () => {
  const [roomUsageData, setRoomUsageData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchData(),
        fetchDepartments(),
        fetchRooms(),
        fetchLockStats(),
      ]);
    };
    loadData();
  }, []);

  const [lockStatsData, setLockStatsData] = useState([]);

  const fetchLockStats = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/employee-lock-stats"
      );
      setLockStatsData(response.data);
    } catch (error) {
      console.error("Error fetching lock stats:", error);
    }
  };

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchMonthlyData = async () => {
    try {
      const response = await axios.get("http://localhost:8080/admin-bookings");
      const filteredData = response.data.filter((booking) => {
        const bookingDate = new Date(booking.BDATE);
        return (
          bookingDate.getMonth() === selectedMonth &&
          bookingDate.getFullYear() === selectedYear &&
          (selectedRoom === "all" || booking.CFRNUM.toString() === selectedRoom)
        );
      });

      const processedData = processRoomUsageData(filteredData);
      setRoomUsageData(processedData);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, selectedYear, selectedRoom]);

  useEffect(() => {
    fetchFilteredData();
  }, [selectedDate, selectedRoom]);

  const fetchData = async () => {
    try {
      const roomUsageResponse = await axios.get(
        "http://localhost:8080/admin-bookings"
      );

      const roomUsage = processRoomUsageData(roomUsageResponse.data);
      setRoomUsageData(roomUsage);

      const statusData = processBookingStatusData(roomUsageResponse.data);
      setBookingStatusData(statusData);

      const departmentResponse = await axios.get(
        "http://localhost:8080/members"
      );
      const deptData = processDepartmentData(departmentResponse.data);
      setDepartmentData(deptData);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("http://localhost:8080/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get("http://localhost:8080/rooms");

      const transformedRooms = response.data.map((room) => ({
        id: room.CFRNUMBER,
        name: room.CFRNAME,
      }));
      setRooms(transformedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchFilteredData = async () => {
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const params = new URLSearchParams();

      if (formattedDate) {
        params.append("date", formattedDate);
      }
      if (selectedRoom !== "all") {
        params.append("roomId", selectedRoom);
      }

      const response = await axios.get(
        `http://localhost:8080/admin-bookings?${params}`
      );
      const filteredBookings = response.data.filter((booking) => {
        const bookingDate = format(new Date(booking.BDATE), "yyyy-MM-dd");
        return bookingDate === formattedDate;
      });

      const processedData = processRoomUsageData(filteredBookings);
      setRoomUsageData(processedData);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  const fetchAllDaysData = async () => {
    try {
      const response = await axios.get("http://localhost:8080/admin-bookings");
      const processedData = processRoomUsageData(response.data);
      setRoomUsageData(processedData);
    } catch (error) {
      console.error("Error fetching all days data:", error);
    }
  };

  const processRoomUsageData = (data) => {
    const roomUsage = {};

    data.forEach((booking) => {
      const date = format(new Date(booking.BDATE), "yyyy-MM-dd");

      if (!roomUsage[date]) {
        roomUsage[date] = {
          date: format(new Date(date), "dd/MM/yyyy"),
          sortDate: date,
          count: 0,
        };
      }
      roomUsage[date].count++;
    });
    return Object.values(roomUsage).sort((a, b) =>
      a.sortDate.localeCompare(b.sortDate)
    );
  };

  const processBookingStatusData = (data) => {
    const statusCounts = {
      total: 0,
      used: 0,
      cancelled: 0,
      noShow: 0,
    };

    data.forEach((booking) => {
      statusCounts.total++;
      if (booking.STUBOOKING === 3) statusCounts.used++;
      else if (booking.STUBOOKING === 5) statusCounts.cancelled++;
      else if (booking.STUBOOKING === 2) statusCounts.noShow++;
    });

    return [
      { name: "การจองทั้งหมด", value: statusCounts.total },
      { name: "เข้าใช้งานแล้ว", value: statusCounts.used },
      { name: "ยกเลิกการจอง", value: statusCounts.cancelled },
      { name: "ไม่มาใช้งาน", value: statusCounts.noShow },
    ];
  };

  const processDepartmentData = (data) => {
    const deptBookings = {};

    data.forEach((member) => {
      if (!deptBookings[member.DNAME]) {
        deptBookings[member.DNAME] = {
          department: member.DNAME,
          bookings: 0,
          employees: new Set(),
        };
      }
      deptBookings[member.DNAME].employees.add(member.SSN);
    });

    return Object.values(deptBookings).map((dept) => ({
      department: dept.department,
      employees: dept.employees.size,
    }));
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <motion.div variants={cardVariants} className="flex flex-col space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">
          รายงานการใช้งานห้องประชุม
        </h2>
        <p className="text-muted-foreground">
          แสดงข้อมูลสถิติการใช้งานห้องประชุมในรูปแบบต่างๆ
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              จำนวนการจองทั้งหมด
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookingStatusData.find((item) => item.name === "การจองทั้งหมด")
                ?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              การจองห้องประชุมทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              อัตราการใช้งานจริง
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                ((bookingStatusData.find(
                  (item) => item.name === "เข้าใช้งานแล้ว"
                )?.value || 0) /
                  (bookingStatusData.find(
                    (item) => item.name === "การจองทั้งหมด"
                  )?.value || 1)) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              อัตราส่วนการเข้าใช้งานจริง
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[700px]">
          <TabsTrigger value="daily">ปริมาณการเข้าใช้ห้อง</TabsTrigger>
          <TabsTrigger value="status">สถานะ</TabsTrigger>
          <TabsTrigger value="department">แผนก</TabsTrigger>
          <TabsTrigger value="lockstats">สถิติการล็อค</TabsTrigger>
        </TabsList>

        <AnimatePresence>
          <TabsContent key="daily" value="daily">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>ปริมาณการใช้งานห้องประชุม</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={fetchAllDaysData}
                    className="mr-2"
                  >
                    แสดงข้อมูลทั้งหมด
                  </Button>

                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="เลือกเดือน" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {new Date(2000, i, 1).toLocaleString("th-TH", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="เลือกปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year + 543}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="เลือกห้องประชุม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกห้อง</SelectItem>
                      {rooms?.map((room) => (
                        <SelectItem
                          key={room.id.toString()}
                          value={room.id.toString()}
                        >
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={roomUsageData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        tickLine={{ stroke: "hsl(var(--foreground))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        tickLine={{ stroke: "hsl(var(--foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          padding: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="จำนวนการจอง"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                        activeDot={{
                          r: 6,
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent key="status" value="status">
            <Card>
              <CardHeader>
                <CardTitle>สถานะการจองห้องประชุม</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent key="department" value="department">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>พนักงานแต่ละแผนก</span>

                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem
                          key={dept.DNUMBER}
                          value={dept.DNUMBER?.toString() || "0"}
                        >
                          {dept.DNAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentData.filter(
                        (dept) =>
                          selectedDepartment === "all" ||
                          dept.department ===
                            departments?.find(
                              (d) =>
                                d.DNUMBER?.toString() === selectedDepartment
                            )?.DNAME
                      )}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="department"
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        tickLine={{ stroke: "hsl(var(--foreground))" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        tickLine={{ stroke: "hsl(var(--foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          padding: "8px",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="employees"
                        name="จำนวนพนักงาน"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent key="lockstats" value="lockstats">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>สถิติการถูกล็อคของพนักงาน</span>
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.DNUMBER} value={dept.DNAME}>
                          {dept.DNAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lockStatsData.filter(
                        (stat) =>
                          selectedDepartment === "all" ||
                          stat.DNAME === selectedDepartment
                      )}
                      margin={{ top: 20, right: 30, left: 20, bottom: 150 }}
                      barGap={20}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey={(d) => `${d.FNAME} ${d.LNAME}`}
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        tickLine={{ stroke: "hsl(var(--foreground))" }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        tickLine={{ stroke: "hsl(var(--foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          padding: "8px",
                        }}
                        formatter={(value, name) => [
                          `${value} ครั้ง`,
                          name === "COUNT"
                            ? "จำนวนครั้งที่ไม่เข้าใช้งานห้อง"
                            : "จำนวนครั้งที่ถูกล็อค",
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "COUNT"
                            ? "จำนวนครั้งที่ไม่เข้าใช้งานห้อง"
                            : "จำนวนครั้งที่ถูกล็อค"
                        }
                        wrapperStyle={{ paddingTop: "20px" }}
                      />
                      <Bar
                        dataKey="COUNT"
                        name="COUNT"
                        fill="hsl(var(--warning))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="LOCKCOUNT"
                        name="LOCKCOUNT"
                        fill="hsl(var(--destructive))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};

export default ReportSection;
