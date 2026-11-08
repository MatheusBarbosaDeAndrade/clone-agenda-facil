import { createContext, useCallback, useContext, useState } from "react";
import { CircleCheck, CircleAlert } from "lucide-react";

const ToastContext = createContext({ notify: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const notify = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, message, type }]);
    setTimeout(
      () => setItems((list) => list.filter((item) => item.id !== id)),
      4000,
    );
  }, []);
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            className={`toast ${item.type === "error" ? "error" : ""}`}
            role="status"
          >
            {item.type === "error" ? (
              <CircleAlert size={18} />
            ) : (
              <CircleCheck size={18} />
            )}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
