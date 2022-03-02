import type { 
    AxiosError as OriginalAxiosError, 
    AxiosRequestConfig, 
    AxiosResponse as OriginalAxiosResponse,
    Canceler
} from 'axios';

export interface AxiosConfig extends AxiosRequestConfig {
    // 以下配置是业务自定义配置
    closeAutoCancel: boolean; 
    maskEl: Element;
    errMsg: string;
    okMsg: string;
    isSilent: boolean;
    cancelFn: (cancel: Canceler) => void
}

export interface AxiosResponse extends OriginalAxiosResponse {
    config: AxiosConfig // 重载
}

export interface AxiosError extends OriginalAxiosError {
    config: AxiosConfig // 重载
}

// 单个资源的数据结构定义：
export interface ResItemByGet {
    [key: string]: any
}

// list的数据结构定义：
export interface ResListByGet {
    items: ResItemByGet[]  // 必有
    [key: string]: any
}

export interface BackendRes {
	status: 'Success' | 'Failure'
	code: 'Ok' | '其他错误状态码'
	msg: string
}

export interface ResReturn<T> {
    success: boolean;
    data?: T;
    msg?: string;
}