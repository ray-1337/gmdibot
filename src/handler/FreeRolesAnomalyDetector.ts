import { Member } from "oceanic.js";
import { freeRolesAnomalyDetectorConfig as detectorConfig } from "./Config";

type FreeRolesAnomalyDetectorInfo = {
    status: boolean;
    memberId: string;
    detail: {
        maxAnomalyMs: number;
        startTimestamp: number;
        stopTimestamp: number;
        durationMs: number;
    }
};

class FreeRolesAnomalyDetector {
    private freeRoleIds: string[];
    private maxAnomalyMs: number;
    private detectCallback: (info: FreeRolesAnomalyDetectorInfo) => void;
    private startTimeMap: {
        [memberId: string]: number
    } = {};
    
    constructor(
        config: {
            freeRoleIds: string[],
            maxAnomalyMs: number,
        },
        detectCallback: (info: FreeRolesAnomalyDetectorInfo) => void
    ) {
        const { freeRoleIds, maxAnomalyMs } = config;
        this.freeRoleIds = freeRoleIds;
        this.maxAnomalyMs = maxAnomalyMs;
        this.detectCallback = detectCallback;
    };

    startDetect(member: Member) {
        /**
         * Call this method to set a start reference for detecting anomaly.
         */
        this.startTimeMap[member.id] = Date.now();
    }

    stopDetect(member: Member) {
        /**
         * Call this method if no need to check that member again.
         */
        if (!(member.id in this.startTimeMap)) return; // Ignore.
        delete this.startTimeMap[member.id];
    }

    memberUpdated(member: Member) {
        /**
         * Call this method every time a member is updated.
         */
        if (!(member.id in this.startTimeMap)) return; // Ignore.

        for (const roleId of this.freeRoleIds) {
            if (!member.roles.includes(roleId)) {
                return; // At least one free role hasn't been taken yet; ignore.
            }
        }
        // All free roles have been taken.
        
        const memberId = member.id;
        const startTimestamp = this.startTimeMap[memberId];
        delete this.startTimeMap[memberId];

        const { durationMs, maxAnomalyMs, detail } = this.makeDetail(startTimestamp);
        const status = (durationMs < maxAnomalyMs);
        const info = { memberId, status, detail };
        this.detectCallback(info);
    }

    private makeDetail(startTimestamp: number) {
        const stopTimestamp = Date.now();
        const durationMs = stopTimestamp - startTimestamp;
        const maxAnomalyMs = this.maxAnomalyMs;

        const detail = { startTimestamp, stopTimestamp, durationMs, maxAnomalyMs };
        return { durationMs, maxAnomalyMs, detail };
    }
};

// Testing: executed asynchronously to prevent blocking 
Promise.all([
    // Test 1: Anomaly path
    new Promise((resolve, reject) => {
        const config = {
            freeRoleIds: ["Role1", "Role2"],
            maxAnomalyMs: 5 * 1000
        };

        const dummyMember = { id: "Member1", roles: [] as string[] } as Member;
        const frad = new FreeRolesAnomalyDetector(config, info => {
            if (dummyMember.roles.length < config.freeRoleIds.length) {
                reject("FreeRolesAnomalyDetector - Test 1 failed - unsufficient member roles");
            } else if (info.memberId != "Member1") {
                reject("FreeRolesAnomalyDetector - Test 1 failed - memberId should be from Member1");
            } else if (info.status != true) {
                reject("FreeRolesAnomalyDetector - Test 1 failed - status should be true");
            } else if (info.detail.maxAnomalyMs != config.maxAnomalyMs) {
                reject("FreeRolesAnomalyDetector - Test 1 failed - detail.durationMs should be same as given");
            } else if (info.detail.durationMs >= info.detail.maxAnomalyMs) {
                reject("FreeRolesAnomalyDetector - Test 1 failed - detail.durationMs should be smaller than detail.maxAnomalyMs");
            } else {
                resolve(true);
            }
            clearTimeout(waitCallTimeout);
        });

        frad.startDetect({ id: "OtherMemberA", roles: [] as string[] } as Member);
        frad.startDetect(dummyMember);
        frad.startDetect({ id: "OtherMemberB", roles: [] as string[] } as Member);
        setTimeout(() => {
            dummyMember.roles.push("Role1");
            frad.memberUpdated(dummyMember);
            setTimeout(() => {
                dummyMember.roles.push("Role2");
                frad.memberUpdated(dummyMember);
            }, 100);
        }, 100);

        const waitCallTimeout = setTimeout(() => {
            reject("FreeRolesAnomalyDetector - Test 1 failed - callback should be called after all roles have been taken");
        }, 1000);
    }),

    // Test 2: Not-anomaly path
    new Promise((resolve, reject) => {
        const config = {
            freeRoleIds: ["Role1", "Role2"],
            maxAnomalyMs: 100
        };

        const frad = new FreeRolesAnomalyDetector(config, info => {
            if (info.status != false) {
                reject("FreeRolesAnomalyDetector - Test 2 failed - status should be false");
            } else if (info.memberId != "Member1") {
                reject("FreeRolesAnomalyDetector - Test 2 failed - memberId should be from Member1");
            } else if (info.detail.maxAnomalyMs != config.maxAnomalyMs) {
                reject("FreeRolesAnomalyDetector - Test 2 failed - detail.durationMs should be same as given");
            } else if (info.detail.durationMs < info.detail.maxAnomalyMs) {
                reject("FreeRolesAnomalyDetector - Test 2 failed - detail.durationMs should not be smaller than detail.maxAnomalyMs");
            } else {
                resolve(true);
            }
            clearTimeout(waitCallTimeout);
        });

        const roles: string[] = [];
        const dummyMember = { id: "Member1", roles } as Member;
        frad.startDetect(dummyMember);
        setTimeout(() => {
            roles.push("Role1");
            frad.memberUpdated(dummyMember);

            setTimeout(() => {
                roles.push("Role2");
                frad.memberUpdated(dummyMember);
            }, 100);
        }, 100);

        const waitCallTimeout = setTimeout(() => {
            reject("FreeRolesAnomalyDetector - Test 2 failed - callback should be called after all roles have been taken");
        }, 1000);
    }),

    // Test 3: Old member path
    new Promise((resolve, reject) => {
        const config = {
            freeRoleIds: ["Role1", "Role2"],
            maxAnomalyMs: 100
        };

        const frad = new FreeRolesAnomalyDetector(config, () => {
            reject("FreeRolesAnomalyDetector - Test 3 failed - callback should not be called");
            clearTimeout(waitCallTimeout);
        });

        const dummyMember = { id: "Member1", roles: ["Role1", "Role2"] } as Member;
        frad.memberUpdated(dummyMember); // No startDetect
        const waitCallTimeout = setTimeout(() => {
            resolve(true);
        }, 500);
    }),

    // Test 4: Stop detect functionality
    new Promise((resolve, reject) => {
        const config = {
            freeRoleIds: ["Role1", "Role2"],
            maxAnomalyMs: 100
        };

        const frad = new FreeRolesAnomalyDetector(config, () => {
            reject("FreeRolesAnomalyDetector - Test 4 failed - callback should not be called");
            clearTimeout(waitCallTimeout);
        });

        const dummyMember = { id: "Member1", roles: ["Role1", "Role2"] } as Member;
        frad.startDetect(dummyMember);
        frad.stopDetect(dummyMember); // Here we don't check the roles.
        frad.memberUpdated(dummyMember);
        const waitCallTimeout = setTimeout(() => {
            resolve(true);
        }, 500);
    })
])
.then(() => {
    console.log("FreeRolesAnomalyDetector - All tests success");
})
.catch(reason => {
    console.error(reason);
});

const { freeRoleIds, maxAnomalyMs } = detectorConfig;
export default new FreeRolesAnomalyDetector({ freeRoleIds, maxAnomalyMs }, x => {
    // TODO: Call bot prevention manager
    console.log(x); // Logging is important.
});
