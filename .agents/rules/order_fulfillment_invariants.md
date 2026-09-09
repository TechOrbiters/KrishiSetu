# Order Fulfillment Sequential Invariant Rules

## Critical Workflow Constraints
1. **Order Creation (Buyer)**:
   - When a buyer places an order, the status is set strictly to `PLACED`.
   - Under no circumstances should a transporter trip or notification be broadcasted at this initial stage.
   - The order goes **firstly to the farmer** for acceptance or rejection.

2. **Farmer Acceptance**:
   - When the farmer accepts the order, the order status transitions to `ACCEPTED`.
   - The platform auto-generates the transport request/trip with status `AVAILABLE`.
   - Transporters receive a real-time notification (`TRANSPORT_REQUESTED` / `ORDER_ACCEPTED`) with explicit **Accept (स्वीकार करें)** and **Reject (अस्वीकार करें)** options.

3. **Farmer Rejection**:
   - When the farmer rejects the order, the order transitions to `REJECTED` (with database status `CANCELLED` and inventory released).
   - Any pending transporter trip is immediately purged or set to cancelled.
   - The buyer interface must prominently alert the buyer:
     > **"आपका यह ऑर्डर किसान द्वारा अस्वीकार कर दिया गया है। कृपया नया ऑर्डर करें।"**
     *(Your this order is rejected, make a new order)*
   - A direct action button **"नया ऑर्डर करें (Make a New Order)"** must be provided to smoothly redirect the buyer to produce discovery / re-ordering without any crash or dead-end.
