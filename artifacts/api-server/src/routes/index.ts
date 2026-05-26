import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import socialRouter from "./social";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(socialRouter);

export default router;
