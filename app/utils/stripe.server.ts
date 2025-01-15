import { Stripe } from "stripe";
import invariant from "tiny-invariant";

invariant(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is not set");

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
