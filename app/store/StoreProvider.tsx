"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { RootStore, getRootStore } from "./RootStore";

const StoreContext = createContext<RootStore | undefined>(undefined);

export const useStore = (): RootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const store = getRootStore();
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};
