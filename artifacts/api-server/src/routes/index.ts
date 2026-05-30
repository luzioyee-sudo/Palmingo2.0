import { Router, type IRouter } from "express";
import healthRouter   from "./health";
import aiRouter       from "./ai";
import socialRouter   from "./social";
import postsRouter    from "./posts";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(socialRouter);
router.use(postsRouter);
router.use(messagesRouter);

export default router;
