import { TextEncoder, TextDecoder } from "util";
import { TransformStream } from "web-streams-polyfill";
import { ReadableStream } from "web-streams-polyfill";
import { Response, Request, Headers } from "node-fetch";
import fetch, {
  Request as _Request,
  Response as _Response,
  Headers as _Headers,
} from "node-fetch";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.TransformStream = TransformStream;
global.ReadableStream = ReadableStream;
global.Response = Response;
global.Request = Request;
global.Headers = Headers;

if (typeof global.URL.createObjectURL === "undefined") {
  global.URL.createObjectURL = jest.fn();
}

class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = [];
  }
  postMessage() {}
  addEventListener(type, listener) {
    if (type === "message") {
      this.listeners.push(listener);
    }
  }
  removeEventListener() {}
  close() {}
}
global.BroadcastChannel = MockBroadcastChannel;

global.fetch = fetch;
global.Request = _Request;
global.Response = _Response;
global.Headers = _Headers;
