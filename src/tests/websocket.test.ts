import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupWebsockets,  notifyCartPriceChanges } from "../services/websocket";
import CartMessage from "../models/cartMessage";

import { io as ClientSocket } from "socket.io-client";

jest.mock("../models/cartMessage");
jest.mock("../models/item");

let httpServer: HTTPServer;
let ioServer: SocketIOServer;
let clientSocket: ReturnType<typeof ClientSocket>;

beforeAll((done) => {
  httpServer = new HTTPServer();
  ioServer = setupWebsockets(httpServer);
  httpServer.listen(() => {
    const port = (httpServer.address() as import("net").AddressInfo).port;
    clientSocket = ClientSocket(`http://localhost:${port}`);
    done();
  });
});

afterAll(() => {
  ioServer.close();
  httpServer.close();
  clientSocket.disconnect();
});

beforeEach(() => {
  jest.clearAllMocks();
});


test("should not process send-message with missing fields", (done) => {
  const incompleteMessage = {
    // Missing cartId
    sender: "Test User",
    message: "Incomplete message",
  };

  const spy = jest.spyOn(console, "log");
  clientSocket.emit("send-message", incompleteMessage);

  setTimeout(() => {
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("❌ Missing required fields"));
    expect(CartMessage.create).not.toHaveBeenCalled();
    spy.mockRestore();
    done();
  }, 100);
});

test("should send testCartNotification", (done) => {
  const testNotification = {
    cartId: "test-cart-123",
    productId: "product-456",
    newPrice: 9.99,
    oldPrice: 14.99
  };

  clientSocket.emit("join-cart", testNotification.cartId);

  setTimeout(() => {
    clientSocket.emit("testCartNotification", testNotification);

    clientSocket.on("price-drop", (data) => {
      expect(data.cartId).toBe(testNotification.cartId);
      expect(data.productId).toBe(testNotification.productId);
      expect(data.newPrice).toBe(testNotification.newPrice);
      expect(data.oldPrice).toBe(testNotification.oldPrice);
      expect(data.message).toBe(`Test notification for cart ${testNotification.cartId}`);
      done();
    });
  }, 100);
});



test("should handle no carts found scenario", async () => {
  const mockCartService = {
    findCartsWithProduct: jest.fn().mockResolvedValue([])
  };

  const mockPriceChange = {
    productId: "product-no-carts",
    newPrice: 9.99,
    oldPrice: 12.99
  };

  const consoleSpy = jest.spyOn(console, "log");

  await notifyCartPriceChanges(ioServer, mockPriceChange, mockCartService);

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining(`No carts found for productId: ${mockPriceChange.productId}`)
  );
  consoleSpy.mockRestore();
});




describe("WebSocket test suite", () => {
  jest.setTimeout(20000);
  

  test("should subscribe to wishlist notifications", (done) => {
    const userId = "test-user-id";
    clientSocket.emit("subscribe-to-wishlists", userId);

    setTimeout(() => {
      const rooms = Array.from(ioServer.sockets.adapter.rooms.keys());
      expect(rooms).toContain(`user-${userId}`);
      done();
    }, 100); // delay to allow socket to join room
  });

  test("should join a custom room", (done) => {
    const roomId = "custom-room-1";
    clientSocket.emit("join-room", roomId);

    setTimeout(() => {
      const rooms = Array.from(ioServer.sockets.adapter.rooms.keys());
      expect(rooms).toContain(roomId);
      done();
    }, 100);
  });

  test("should get active rooms", (done) => {
    clientSocket.emit("get-active-rooms");
    clientSocket.on("active-rooms", (rooms) => {
      expect(Array.isArray(rooms)).toBe(true);
      done();
    });
  });

  test("should join a cart room", (done) => {
    const cartId = "test-cart";
    clientSocket.emit("join-cart", cartId);

    // Wait briefly to ensure server processes the event
    setTimeout(() => {
      // Emit a test message to the room
      ioServer.to(`cart-${cartId}`).emit("receive-message", { cartId });

      clientSocket.on("receive-message", (data) => {
        expect(data.cartId).toBe(cartId);
        done();
      });
    }, 50);
  });

  test("should leave a cart room", (done) => {
    const cartId = "test-cart";

    clientSocket.emit("join-cart", cartId);

    setTimeout(() => {
      clientSocket.emit("leave-cart", cartId);

      // Wait to ensure room leave is processed
      setTimeout(() => {
        // Emit after leaving — client should NOT receive it
        ioServer.to(`cart-${cartId}`).emit("receive-message", { cartId });

        clientSocket.on("receive-message", () => {
          done.fail("Client should not receive message after leaving room");
        });

        setTimeout(() => done(), 100); // If nothing received, test passes
      }, 50);
    }, 50);
  });



  (CartMessage.create as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

  test("should handle DB error on send-message", (done) => {
    const badMessage = {
      cartId: "error-cart",
      sender: "tester",
      message: "Fail this one",
      clientId: "client-789",
      timestamp: new Date().toISOString(),
    };

    clientSocket.emit("send-message", badMessage);

    clientSocket.on("message-error", (err) => {
      expect(err).toEqual({ error: "Failed to save message" });
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
