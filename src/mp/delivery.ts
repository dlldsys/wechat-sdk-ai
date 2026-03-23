import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class DeliveryAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async getAllDelivery(accessToken: string): Promise<WxResponse<{
    delivery_list: Array<{
      delivery_id: string;
      delivery_name: string;
      delivery_icon: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getalldelivery?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async getDeliveryList(accessToken: string): Promise<WxResponse<{
    count: number;
    list: Array<{
      delivery_id: string;
      delivery_name: string;
      delivery_icon: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getdeliverylist?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async addDeliveryOrder(accessToken: string, orderData: {
    delivery_id: string;
    bindopenid: string;
    remark?: string;
    customs?: string;
    cert_type?: string;
    cert_no?: string;
    receiver: {
      name: string;
      tel: string;
      mobile?: string;
      province: string;
      city: string;
      area: string;
      address: string;
    };
    insured: {
      use_insured: number;
      insured_value: number;
    };
    shop: {
      wxa_path: string;
      img_url: string;
      good_count: number;
      good_name: string;
    };
    cargo: {
      goods: Array<{
        goods_name: string;
        goods_count: number;
      }>;
    };
  }): Promise<WxResponse<{
    order_id: string;
    waybill_id: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/adddeliveryorder?access_token=${accessToken}`;
    return this.http.postJson(url, orderData);
  }

  async cancelDeliveryOrder(accessToken: string, orderId: string, openid: string, deliveryId: string, cancelReason: string = '', cancelType: number = 1): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/canceldeliveryorder?access_token=${accessToken}`;
    return this.http.postJson(url, {
      order_id: orderId,
      openid,
      delivery_id: deliveryId,
      cancel_reason: cancelReason,
      cancel_type: cancelType,
    });
  }

  async getDeliveryOrder(accessToken: string, orderId: string, openid: string): Promise<WxResponse<{
    order_id: string;
    delivery_id: string;
    waybill_id: string;
    order_status: number;
    dispatcher_order_id?: string;
    update_times: number;
    reserve_time?: number;
    deliverymsg?: string;
    finish_time?: number;
    rider_name?: string;
    rider_mobile?: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getdeliveryorder?access_token=${accessToken}`;
    return this.http.postJson(url, { order_id: orderId, openid });
  }

  async getDeliveryTrack(accessToken: string, orderId: string, openid: string, deliveryId: string, waybillId: string, chipId?: string): Promise<WxResponse<{
    count: number;
    list: Array<{
      action_time: number;
      action_type: number;
      action_msg: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getdeliverytrack?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      order_id: orderId,
      openid,
      delivery_id: deliveryId,
      waybill_id: waybillId,
    };
    if (chipId) data['chip_id'] = chipId;
    return this.http.postJson(url, data);
  }

  async getAllErrDelivery(accessToken: string): Promise<WxResponse<{
    count: number;
    list: Array<{
      order_id: string;
      errcode: number;
      errmsg: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getallerrdelivery?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async mockUpdateOrder(accessToken: string, orderId: string, actionType: number, actionMsg: string = ''): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/mockupdateorder?access_token=${accessToken}`;
    return this.http.postJson(url, {
      order_id: orderId,
      action_type: actionType,
      action_msg: actionMsg,
    });
  }

  async preAddDeliveryOrder(accessToken: string, deliveryId: string): Promise<WxResponse<{
    delivery_id: string;
    shop_no?: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/preadddeliveryorder?access_token=${accessToken}`;
    return this.http.postJson(url, { delivery_id: deliveryId });
  }

  async preCancelDeliveryOrder(accessToken: string, orderId: string, openid: string, deliveryId: string): Promise<WxResponse<{
    order_id: string;
    can_cancel: boolean;
    fail_msg?: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/precanceldeliveryorder?access_token=${accessToken}`;
    return this.http.postJson(url, {
      order_id: orderId,
      openid,
      delivery_id: deliveryId,
    });
  }

  async reOrder(accessToken: string, orderId: string, openid: string, deliveryId: string): Promise<WxResponse<{
    order_id: string;
    waybill_id: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/reorder?access_token=${accessToken}`;
    return this.http.postJson(url, {
      order_id: orderId,
      openid,
      delivery_id: deliveryId,
    });
  }

  async getAgentList(accessToken: string): Promise<WxResponse<{
    count: number;
    list: Array<{
      agentid: string;
      name: string;
      phone: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getagentlist?access_token=${accessToken}`;
    return this.http.get(url);
  }
}

export class InstantDeliveryAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async bindAccount(accessToken: string, deliveryId: string, bindType: number, phoneNo: string, applyId?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/instance/bind?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      delivery_id: deliveryId,
      bind_type: bindType,
      phone_no: phoneNo,
    };
    if (applyId) data['apply_id'] = applyId;
    return this.http.postJson(url, data);
  }

  async updatePrinter(accessToken: string, deliveryId: string, command: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/instance/updateprinter?access_token=${accessToken}`;
    return this.http.postJson(url, {
      delivery_id: deliveryId,
      command,
    });
  }

  async addShop(accessToken: string, deliveryId: string, shop: {
    opening_hours: string;
    phone: string;
    address: string;
    name: string;
    latitude: number;
    longitude: number;
  }): Promise<WxResponse<{
    shop_id: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/instance/addshop?access_token=${accessToken}`;
    return this.http.postJson(url, {
      delivery_id: deliveryId,
      ...shop,
    });
  }

  async getShop(accessToken: string, deliveryId: string): Promise<WxResponse<{
    shop_list: Array<{
      shop_id: string;
      opening_hours: string;
      phone: string;
      address: string;
      name: string;
      latitude: number;
      longitude: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/instance/getshop?access_token=${accessToken}`;
    return this.http.postJson(url, { delivery_id: deliveryId });
  }
}
