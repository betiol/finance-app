import UserStorage from "@shared/UserStorage";
const { stringify } = require("querystring");

const BASE_URL = "https://finaceapi.herokuapp.com/v1";
export class ValidationError extends Error {
  constructor(message, validationErrors) {
    super(message);

    this.name = "ValidationError";

    this.validationErrors = validationErrors;
  }
}

export default class Api {
  static async fetchResource(
    method = "GET",
    endpoint = "/",
    params = {},
    requireAuth = false
  ) {
    let headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json"
    });

    if (requireAuth) {
      let tokenStorage = await UserStorage.getToken();
      headers.set("Authorization", tokenStorage);
    }

    let uri = BASE_URL + endpoint;
    let response;

    if (method === "GET" || method === "DELETE") {
      uri += "?" + stringify(params);
      response = await fetch(uri, { method, headers });
    } else {
      response = await fetch(uri, {
        method,
        headers,
        body: JSON.stringify(params)
      });
    }

    if (!response.ok) {
      let type = response.headers.get("Content-type");
      if (type && type.indexOf("json") != -1) {
        let jsonResponse = await response.json();
        if (jsonResponse.ModelState) {
          throw new ValidationError(jsonResponse.message);
        } else {
          throw new Error(
            jsonResponse.message ||
              jsonResponse.error_description ||
              jsonResponse.error
          );
        }
        return jsonResponse;
      } else {
        let textResponse = await response.text();
        throw new Error(textResponse);
      }
    }

    try {
      return await response.json();
    } catch (e) {
      return {};
    }
  }

  static async login({ email, password }) {
    let endpoint = "/login";
    return Api.fetchResource("POST", endpoint, {
      email,
      password
    });
  }

  static async account() {
    let res = await Api.getListResource("/accounts", {}, (requireAuth = true));
    return res;
  }

  static async getListResource(resource, params = {}, requireAuth = false) {
    let endpoint = resource;
    return Api.fetchResource("GET", endpoint, params, requireAuth);
  }
}