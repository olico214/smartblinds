"use client";

import CotizacionChainDrawer from "@/component/cotizacionChainDrawer/chainDrawer";

export default function CotizacionDetailActions({ id, user, cotizacion, isAdmin }) {
    return (
        <CotizacionChainDrawer currentId={id} viewMode="detail" user={user} parentData={cotizacion} isAdmin={isAdmin} />
    );
}
