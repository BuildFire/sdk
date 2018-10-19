import '../../stencil.core';
import { EventEmitter } from '../../stencil.core';
declare enum View {
    grid = 0,
    list = 1
}
export declare class Grid {
    token: string;
    images: string[];
    viewState: View;
    handleBack(event: any): void;
    imageSelected: EventEmitter;
    showList(event: UIEvent): void;
    render(): JSX.Element;
}
export {};
