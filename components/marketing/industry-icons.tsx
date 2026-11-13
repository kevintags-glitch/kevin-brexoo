import { Bug, Building, Droplets, Fence, Grid2x2, Hammer, House, Leaf, PaintRoller, SprayCan, Trees, Warehouse, Wrench, Zap, Snowflake, type LucideIcon } from "lucide-react";

export const INDUSTRY_ICON: Record<string, LucideIcon> = {
  home_builder: House,
  property_developer: Building,
  electrician: Zap,
  plumber: Droplets,
  hvac: Snowflake,
  renovation: Hammer,
  roofing: Warehouse,
  landscaping: Trees,
  lawn_care: Leaf,
  cleaning: SprayCan,
  painting: PaintRoller,
  flooring: Grid2x2,
  fencing_decking: Fence,
  property_maintenance: Wrench,
  pest_control: Bug,
};

export const BUILDER_CODES = ["home_builder", "property_developer", "renovation"];
export const TRADE_CODES = ["electrician", "plumber", "hvac", "roofing", "landscaping", "lawn_care", "cleaning", "painting", "flooring", "fencing_decking", "property_maintenance", "pest_control"];
