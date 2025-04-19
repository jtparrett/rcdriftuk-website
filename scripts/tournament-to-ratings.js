"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_server_1 = require("~/utils/prisma.server");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var battles, ratingBattles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_server_1.prisma.tournamentBattles.findMany({
                    where: {
                        tournamentId: "bcb1a684-e0d4-4b88-9c44-1172572c27ae",
                    },
                    orderBy: {
                        id: "asc",
                    },
                    include: {
                        driverLeft: {
                            include: {
                                user: true,
                            },
                        },
                        driverRight: {
                            include: {
                                user: true,
                            },
                        },
                    },
                })];
            case 1:
                battles = _a.sent();
                ratingBattles = battles.map(function (battle) {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    var leftWinner = battle.winnerId === battle.driverLeftId;
                    return {
                        winnerId: leftWinner
                            ? (_b = (_a = battle.driverLeft) === null || _a === void 0 ? void 0 : _a.user.driverId) !== null && _b !== void 0 ? _b : 0
                            : (_d = (_c = battle.driverRight) === null || _c === void 0 ? void 0 : _c.user.driverId) !== null && _d !== void 0 ? _d : 0,
                        loserId: leftWinner
                            ? (_f = (_e = battle.driverRight) === null || _e === void 0 ? void 0 : _e.user.driverId) !== null && _f !== void 0 ? _f : 0
                            : (_h = (_g = battle.driverLeft) === null || _g === void 0 ? void 0 : _g.user.driverId) !== null && _h !== void 0 ? _h : 0,
                        tournament: "2025-SLDN",
                    };
                });
                return [4 /*yield*/, prisma_server_1.prisma.driverRatingBattles.createMany({
                        data: ratingBattles,
                    })];
            case 2:
                _a.sent();
                console.log("total battles: " + battles.length);
                return [2 /*return*/];
        }
    });
}); };
run();
