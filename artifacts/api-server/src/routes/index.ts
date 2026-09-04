import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clinicRouter from "./clinic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clinicRouter);

export default router;
