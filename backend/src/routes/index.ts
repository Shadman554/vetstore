import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import settingsRouter from "./settings";
import catalogRouter from "./catalog";
import ordersRouter from "./orders";
import vendorAuthRouter from "./vendor-auth";
import vendorDashboardRouter from "./vendor-dashboard";
import customerAuthRouter from "./customer-auth";
import adminMarketplaceRouter from "./admin-marketplace";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(settingsRouter);
router.use(catalogRouter);
router.use(ordersRouter);
router.use(vendorAuthRouter);
router.use(vendorDashboardRouter);
router.use(customerAuthRouter);
router.use(adminMarketplaceRouter);

export default router;
