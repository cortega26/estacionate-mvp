import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="flex items-center gap-4 bg-[#009EE3] p-6 text-white">
                    <Link to="/signup" className="rounded-full p-2 transition-colors hover:bg-blue-600">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">Términos y Condiciones de Uso</h1>
                </div>

                <div className="prose prose-blue max-w-none p-8 text-gray-700">
                    {/* TODO legal-review: Replace or validate Phase 1 SaaS B2B terms before any real pilot. */}
                    <p className="mb-8 text-sm text-gray-500">
                        <strong>Última actualización:</strong> 28 de abril de 2026
                    </p>

                    <p>
                        Estos términos describen el uso de <strong>Estaciónate</strong> en su fase
                        habilitada actual: software SaaS B2B para comunidades y administradoras
                        chilenas, sin pagos integrados por uso de estacionamientos de visita.
                    </p>
                    <p>
                        Este texto no reemplaza una revisión legal definitiva ni el contrato SaaS B2B
                        que debe firmarse con cada comunidad o administradora antes de un piloto real.
                    </p>

                    <hr className="my-8" />

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">1. Naturaleza del Servicio</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>Estaciónate provee software para ordenar reglas, reservas, validación en conserjería, trazabilidad y reportes operacionales.</li>
                        <li>La comunidad o administradora define las reglas aplicables a su edificio, incluyendo horarios, cupos, autorizaciones y protocolos de acceso.</li>
                        <li>Estaciónate no vende, ofrece ni explota estacionamientos. Tampoco presta vigilancia, custodia, seguro vehicular ni control físico del recinto.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">2. Fase Habilitada</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>La fase habilitada es <strong>Fase 1: SaaS B2B sin pagos integrados</strong>.</li>
                        <li>En Fase 1 no existe cobro directo a visitantes dentro de la plataforma.</li>
                        <li>En Fase 1 no existe cobro de residentes a comunidad dentro de la plataforma.</li>
                        <li>En Fase 1 no existen payouts, custodia de fondos ni liquidación de fondos de comunidades por parte de Estaciónate.</li>
                        <li>Cualquier pantalla o flujo de pago disponible en ambientes de desarrollo debe tratarse como demo/simulador y no como operación productiva.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">3. Usuarios y Responsabilidades Operacionales</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>Los residentes usan la plataforma para registrar o solicitar reservas conforme a las reglas del edificio.</li>
                        <li>La conserjería o personal autorizado valida reservas por patente, código o QR cuando corresponda, y registra evidencia operacional.</li>
                        <li>La administración mantiene control sobre reglas, permisos, protocolos e instrucciones al personal del edificio.</li>
                        <li>Estaciónate mantiene el software y los registros técnicos bajo el contrato SaaS B2B correspondiente.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">4. Acceso, Validación y Trazabilidad</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>La plataforma puede registrar datos mínimos necesarios para gestionar reservas y validación de acceso, como nombre de visita, patente, horario, edificio, cupo y código de confirmación.</li>
                        <li>La validación en conserjería no constituye autorización de pago ni recaudación de dinero.</li>
                        <li>Los registros de actividad buscan entregar evidencia ante consultas, reclamos, auditorías internas o revisión del comité/administración.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">5. Pagos y Módulos Futuros</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>Los pagos por uso de estacionamientos de visita no están habilitados en Fase 1.</li>
                        <li>Los módulos de cobro diferido, pagos integrados, PSP, comisiones por uso y payouts están bloqueados como fases futuras, sujetos a los gates legales, tributarios, de asamblea y regulatorios definidos en la documentación legal/comercial del repositorio.</li>
                        <li>Estaciónate puede cobrar a la comunidad o administradora una suscripción SaaS mensual o anual por el uso del software, según contrato B2B.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">6. Seguridad, Custodia y Responsabilidad por Vehículos</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>Estaciónate no presta servicios de vigilancia, custodia, guarda, seguro ni monitoreo físico de vehículos o bienes.</li>
                        <li>La comunidad, administradora, conserjería y usuarios deben cumplir las reglas internas del edificio y la normativa aplicable.</li>
                        <li>Los incidentes operacionales deben registrarse y escalarse conforme al protocolo definido por la comunidad o administradora.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">7. Datos Personales</h2>
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>El tratamiento de datos personales debe regirse por la normativa chilena aplicable y por un Acuerdo de Tratamiento de Datos o documento equivalente entre la comunidad/administradora y Estaciónate.</li>
                        <li>La comunidad o administradora actúa como responsable del tratamiento respecto de su edificio; Estaciónate actúa como encargado del tratamiento en el marco del servicio SaaS.</li>
                        <li>La política de privacidad, DPA, retención de datos y derechos de titulares deben revisarse y formalizarse en documentos separados antes de operar con datos reales de comunidades.</li>
                    </ol>

                    <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">8. Revisión Legal</h2>
                    <p>
                        Estos términos son una base prudente para Fase 1 y deben ser reemplazados o
                        validados por asesoría legal chilena antes de cualquier piloto real.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <Link to="/signup" className="rounded-lg bg-[#009EE3] px-6 py-3 text-white transition-colors hover:bg-blue-600">
                            Volver al Registro
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
