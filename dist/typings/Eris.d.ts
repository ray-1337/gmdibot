import Eris from "eris";
import GMDIBot from "../handler/Client";

export declare module "eris" {
  type GMDIExtension = GMDIBot;
};