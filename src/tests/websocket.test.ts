import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupWebsockets } from "../services/websocket";
import CartMessage from "../models/cartMessage";
import { io as ClientSocket } from "socket.io-client";

jest.mock("../models/cartMessage");

let httpServer: HTTPServer;
let ioServer: SocketIOServer;
let clientSocket: ReturnType<typeof ClientSocket>;

beforeAll((done) => {
  httpServer = new HTTPServer();
  ioServer = setupWebsockets(httpServer);
  httpServer.listen(() => {
    const port = (httpServer.address() as import("net").AddressInfo).port;
    clientSocket = ClientSocket(`http://localhost:${port}`);
    clientSocket.on("connect", done);
  });
});

afterAll(() => {
  ioServer.close();
  httpServer.close();
});

describe("WebSocket test suite", () => {
  jest.setTimeout(20000); // Set timeout to 20 seconds for long-running tests

  test("should connect to WebSocket server", (done) => {
    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  test("should join a cart room", (done) => {
    const cartId = "test-cart-id";
    clientSocket.emit("join-cart", cartId);
    clientSocket.on("joined-cart", (message: string) => {
      expect(message).toBe(`Joined cart ${cartId}`);
      done();
    });
  });

  test("should leave a cart room", (done) => {
    const cartId = "test-cart-id";
    clientSocket.emit("leave-cart", cartId);
    clientSocket.on("left-cart", (message: string) => {
      expect(message).toBe(`Left cart ${cartId}`);
      done();
    });
  });

  test("should send and receive a message in a cart room", (done) => {
    const cartId = "test-cart-id";
    const messageData = {
      cartId,
      sender: "Test User",
      message: "Hello, this is a test message!",
      clientId: "test-client-id",
      timestamp: new Date(),
    };

    (CartMessage.create as jest.Mock).mockResolvedValue({
      ...messageData,
      _id: "test-message-id",
    });

    clientSocket.emit("send-message", messageData);

    clientSocket.on("receive-message", (message) => {
      expect(message.cartId).toBe(cartId);
      expect(message.sender).toBe("Test User");
      expect(message.message).toBe("Hello, this is a test message!");
      done();
    });
  });

  test("should handle invalid message data", (done) => {
    clientSocket.emit("send-message", { cartId: null, message: null });
    clientSocket.on("message-error", (error) => {
      expect(error).toEqual({ error: "Failed to save message" });
      done();
    });
  });

  test("should notify price drop in a cart room", (done) => {
    const cartId = "test-cart-id";
    const priceDropNotification = {
      cartId,
      productId: "test-product-id",
      newPrice: 10,
      oldPrice: 15,
      message: "Test notification for cart test-cart-id",
    };

    clientSocket.emit("testCartNotification", priceDropNotification);

    clientSocket.on("price-drop", (notification) => {
      expect(notification).toEqual(priceDropNotification);
      done();
    });
  });

  test("should disconnect from WebSocket server", (done) => {
    clientSocket.on("disconnect", () => {
      expect(clientSocket.connected).toBe(false);
      done();
    });
    clientSocket.disconnect();
  });
});
