import React, { useEffect, useState } from "react";
import io from "Socket.IO-client";
let socket: any;
interface TerminalMsgs {
  cmd: string;
  pid: string;
  msg: string;
  index: number;
}
const Manage = () => {
  const [msg, setMsg] = useState<TerminalMsgs[]>([]);
  useEffect(() => {
    const socketInitializer = async () => {
      socket = io("http://localhost:1235");

      socket.on("message", (data: any) => {
        console.log(data);
        msg[data.index] = data;
        setMsg(msg);
        console.log(msg);
      });
    };
    socketInitializer();
  }, []);

  const onChangeHandler = (e: any, i: number) => {
    msg[i].cmd = e.target.value;
    console.log(msg);
    setMsg([...msg]);
  };

  const handleClick = (m: TerminalMsgs, i: number) => {
    socket.emit("execute-cmd", m);
  };
  const handleKill = () => {
    socket.emit("kill-terminal");
    setMsg([]);
  };

  const handleAdd = () => {
    const addM = {
      pid: "",
      msg: "",
      cmd: "",
      index: msg.length,
    };
    setMsg((prev) => {
      return [...prev, addM];
    });
  };
  return (
    <div>
      Manage
      <button onClick={handleAdd}>Add</button>
      {msg?.map((m, i) => {
        return (
          <div className="">
            <input
              placeholder="Type something"
              value={m.cmd}
              onChange={(e) => onChangeHandler(e, i)}
            />
            <button onClick={() => handleClick(m, i)}>Click</button>
            <button onClick={handleKill}>Kill</button>
            <div className="">{m.msg}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Manage;
// cd /Users/karthikn/Dev/portfolio-v2 && npm start
