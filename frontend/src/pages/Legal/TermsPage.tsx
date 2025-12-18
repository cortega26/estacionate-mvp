import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#009EE3] p-6 text-white flex items-center gap-4">
                    <Link to="/signup" className="hover:bg-blue-600 p-2 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">Términos y Condiciones de Uso</h1>
                </div>

                <div className="p-8 prose prose-blue max-w-none text-gray-700">
                    <p className="text-sm text-gray-500 mb-8"><strong>Última actualización:</strong> 17 de diciembre de 2025</p>

                    <p>Al acceder y utilizar la plataforma <strong>Estaciónate</strong> (en adelante, la <strong>“Plataforma”</strong>), usted declara haber leído, entendido y aceptado íntegramente los presentes Términos y Condiciones (los <strong>“T&C”</strong>). Si no está de acuerdo con ellos, debe abstenerse de utilizar la Plataforma.</p>

                    <hr className="my-8" />

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Definiciones y Naturaleza del Servicio</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Plataforma / Estaciónate:</strong> Servicio tecnológico <strong>SaaS</strong> de intermediación (Marketplace <strong>B2B2C</strong>) que provee herramientas digitales para publicar, reservar y pagar el uso temporal de espacios de estacionamiento.</li>
                        <li><strong>Propietario / Condominio (Prestador):</strong> Persona natural o jurídica, comunidad o condominio que ofrece espacios de estacionamiento para uso temporal, con autorización legal y reglamentaria válida.</li>
                        <li><strong>Visitante / Usuario Conductor (Usuario):</strong> Persona que reserva y utiliza un espacio de estacionamiento a través de la Plataforma.</li>
                        <li><strong>Reserva:</strong> Contratación del uso temporal de un espacio publicada en la Plataforma, por un periodo determinado, a cambio de un precio.</li>
                        <li><strong>Recinto:</strong> Inmueble o conjunto habitacional donde se ubica el estacionamiento ofrecido.</li>
                        <li><strong>Normas del Recinto:</strong> Reglamento de copropiedad, protocolos de acceso, instrucciones de conserjería/seguridad y cualquier norma interna aplicable.</li>
                    </ul>
                    <p className="mt-4"><strong>Naturaleza del servicio:</strong> Estaciónate actúa como <strong>intermediario tecnológico</strong>. Estaciónate <strong>no es propietaria, poseedora, administradora ni explotadora</strong> de los estacionamientos ofrecidos; no tiene control material de los recintos ni presta materialmente el servicio de estacionamiento.</p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Marco Legal Aplicable</h2>
                    <p>Estos T&C se rigen por las leyes de la República de Chile, incluyendo (sin limitarse a):</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Ley N° <strong>19.496</strong> sobre Protección de los Derechos de los Consumidores (cuando corresponda).</li>
                        <li><strong>Código Civil</strong>.</li>
                        <li>Ley N° <strong>21.442</strong> sobre Copropiedad Inmobiliaria.</li>
                        <li>Reglamentos de copropiedad y normativa interna de cada condominio/recinto.</li>
                    </ul>
                    <p className="mt-4"><strong>Regla de interpretación:</strong> Nada de lo aquí dispuesto podrá interpretarse como renuncia a derechos irrenunciables establecidos por la legislación chilena ni como exclusión de responsabilidades que la ley declare imperativas.</p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Rol, Alcance y Delimitación Máxima de Responsabilidad de Estaciónate (SaaS B2B2C)</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Estaciónate actúa <strong>exclusivamente</strong> como plataforma tecnológica SaaS de intermediación (B2B2C).</li>
                        <li>Estaciónate <strong>no presta materialmente</strong> el servicio de estacionamiento y <strong>no tiene posesión, tenencia, ni control físico o funcional</strong> sobre los recintos, accesos, infraestructura, portones, señalética, iluminación, cámaras, guardias, personal, protocolos operativos, ni sobre la administración del condominio.</li>
                        <li>En consecuencia, Estaciónate <strong>no asume deberes de custodia, vigilancia, guarda ni seguridad</strong> respecto de vehículos, bienes o personas.</li>
                        <li>Estaciónate <strong>solo será responsable</strong> por daños derivados <strong>directa y exclusivamente</strong> de una <strong>culpa grave o dolo propio</strong>, atribuible a fallas críticas del sistema tecnológico bajo su control directo (por ejemplo, errores críticos del sistema en asignación de reservas o procesamiento de pagos que generen un perjuicio directo).</li>
                        <li>Se excluye toda responsabilidad de Estaciónate por hechos, omisiones o faltas de diligencia imputables al Propietario/Condominio, a su administrador, conserjería/seguridad, a otros usuarios o a terceros.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Régimen Máximo de Responsabilidad por Daños, Robos y Accidentes</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>El servicio de estacionamiento es prestado <strong>materialmente</strong> por el <strong>Propietario/Condominio</strong>, quien asume el deber legal de cuidado que le corresponda conforme a la legislación vigente.</li>
                        <li>El Usuario declara conocer y aceptar que, salvo que el Propietario/Condominio lo indique expresamente, el servicio <strong>no incluye</strong> vigilancia, custodia, guarda ni monitoreo del vehículo.</li>
                        <li>Los daños al vehículo, robos, hurtos, sustracción de especies, accidentes personales o materiales que ocurran con ocasión del uso del estacionamiento serán imputables únicamente a quien resulte responsable conforme a la ley, en función de su conducta, culpa o dolo.</li>
                        <li>Estaciónate no será responsable por dichos eventos, <strong>salvo</strong> que se acredite judicialmente una culpa propia <strong>directa, grave y específica</strong> en su rol de intermediario tecnológico.</li>
                        <li>Estas disposiciones no implican renuncia a derechos irrenunciables ni exclusión de responsabilidades imperativas.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Requisitos de Cuenta, Identidad y Acceso</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>El Usuario debe proporcionar información veraz y actualizada, incluyendo al menos <strong>nombre, RUT y patente</strong> del vehículo.</li>
                        <li>El Usuario acepta que el acceso al recinto puede requerir validación por conserjería/seguridad y cumplimiento de protocolos del edificio.</li>
                        <li>Estaciónate podrá solicitar verificaciones adicionales de identidad o medios de pago, por seguridad y prevención de fraude.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Obligaciones del Usuario Conductor</h2>
                    <p>El Usuario se obliga a:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Usar exclusivamente</strong> el espacio asignado en su Reserva.</li>
                        <li><strong>Respetar horarios</strong> de entrada y salida pactados.</li>
                        <li>Cumplir las Normas del Recinto, incluyendo instrucciones de conserjería/seguridad, señalización interna, velocidad prudente, ruidos molestos y reglas de áreas comunes.</li>
                        <li>Mantener su vehículo en condiciones seguras (frenos, fugas de fluidos, etc.) y evitar cualquier conducta que genere riesgo o daño.</li>
                        <li>Responder por daños que cause por acción u omisión al recinto, infraestructura, a terceros o a otros vehículos.</li>
                    </ol>
                    <p className="mt-2">El incumplimiento grave podrá dar lugar a suspensión o terminación de la cuenta, sin perjuicio de acciones legales.</p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Obligaciones, Declaraciones y Asunción de Riesgo del Propietario/Condominio (Prestador)</h2>
                    <p>El Propietario/Condominio declara y garantiza que:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Cuenta con plena autorización legal y reglamentaria para ofrecer los espacios (incluyendo estacionamientos de visita en exceso), conforme a la Ley N° 21.442 y al reglamento de copropiedad aplicable.</li>
                        <li>Asume la calidad de <strong>prestador material</strong> del servicio de estacionamiento respecto de cada Reserva.</li>
                        <li>Se obliga a mantener el espacio razonablemente habilitado y disponible en los horarios publicados.</li>
                        <li>Reconoce que Estaciónate no controla ni administra el recinto, y que su rol es tecnológico.</li>
                        <li><strong>Indemnidad (máximo permitido):</strong> El Propietario/Condominio se obliga a mantener indemne a Estaciónate frente a reclamos, demandas, multas o sanciones que deriven de su actuar, omisiones, incumplimientos normativos, o de la prestación material del servicio, <strong>en la medida permitida por la ley</strong>.</li>
                        <li>Esta cláusula constituye un pacto de distribución interna de responsabilidad y no afecta derechos de terceros conforme a la ley.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Publicación de Espacios, Disponibilidad y Calidad</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>El Propietario/Condominio es responsable de la exactitud de la información publicada (ubicación, instrucciones de acceso, restricciones, horarios, precio).</li>
                        <li>Estaciónate podrá suspender publicaciones o cuentas que presenten información engañosa, incompleta, o que genere riesgos para usuarios.</li>
                        <li>Estaciónate no garantiza que un espacio cumpla un propósito específico del Usuario (por ejemplo, dimensiones para vehículos grandes), salvo que así se haya declarado expresamente en la publicación.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Pagos, Comisiones, Cancelaciones y Reembolsos</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Los pagos se realizan por adelantado mediante los medios habilitados en la Plataforma (por ejemplo, pasarelas de pago).</li>
                        <li>Estaciónate percibe una <strong>comisión por intermediación tecnológica</strong> (service fee), informada antes de confirmar la Reserva.</li>
                        <li>Política de cancelación del Usuario:
                            <ul className="list-disc pl-5 mt-2">
                                <li>Cancelación con al menos <strong>24 horas</strong> de anticipación: reembolso del monto pagado <strong>menos</strong> la comisión de Estaciónate.</li>
                                <li>Cancelación con menos de <strong>24 horas</strong>: no procede reembolso, salvo obligación legal en contrario.</li>
                            </ul>
                        </li>
                        <li>Reembolsos: se procesarán por el mismo medio de pago utilizado, sujeto a plazos de la pasarela/entidad financiera.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">10. Excesos de Tiempo, Cobros Adicionales y Conductas Prohibidas</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>El uso del estacionamiento fuera del horario reservado podrá generar cobros adicionales proporcionales al tiempo efectivamente utilizado, cuando ello sea aplicable y permitido por la normativa vigente.</li>
                        <li>Estaciónate no autoriza prácticas arbitrarias, desproporcionadas o contrarias a la ley.</li>
                        <li>Se prohíbe:
                            <ul className="list-disc pl-5 mt-2">
                                <li>Subarrendar o ceder la Reserva sin autorización expresa del Propietario/Condominio y/o de Estaciónate.</li>
                                <li>Usar el espacio para fines ilícitos, almacenamiento, reparación mecánica, o cualquier actividad no compatible con el uso de estacionamiento.</li>
                                <li>Ingresar con vehículos que derramen combustibles/aceites u otros fluidos peligrosos.</li>
                            </ul>
                        </li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">11. Suspensión, Terminación y Medidas de Seguridad</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Estaciónate podrá suspender o cancelar cuentas y/o Reservas por: fraude, suplantación, información falsa, incumplimientos reiterados, riesgos a la seguridad, o infracciones a la ley y/o a estos T&C.</li>
                        <li>Estaciónate podrá retener pagos o realizar reversos cuando exista sospecha razonable de fraude o disputas de pago, conforme a políticas de la pasarela y la ley aplicable.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">12. Protección de Datos Personales</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Los datos personales serán tratados conforme a la legislación chilena vigente y a la <strong>Política de Privacidad</strong> de Estaciónate, disponible en la Plataforma.</li>
                        <li>Estaciónate podrá compartir datos mínimos necesarios (por ejemplo, nombre, RUT y patente) con el Propietario/Condominio para permitir control de acceso y cumplimiento de la Reserva, conforme a la normativa aplicable.</li>
                    </ol>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">13. Propiedad Intelectual</h2>
                    <p>La Plataforma, su software, marca, interfaz, y contenidos propios son propiedad de Estaciónate o sus licenciantes. Se prohíbe su uso no autorizado.</p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">14. Modificaciones de los T&C</h2>
                    <p>Estaciónate podrá modificar estos T&C en cualquier momento. Las modificaciones entrarán en vigencia desde su publicación en la Plataforma. Para usuarios activos, Estaciónate podrá notificar cambios relevantes por medios razonables.</p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">15. Comunicaciones</h2>
                    <p>El Usuario acepta recibir comunicaciones relacionadas con Reservas, seguridad, soporte y cambios contractuales a través de correo electrónico, SMS o notificaciones dentro de la app/web.</p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">16. Ley Aplicable y Jurisdicción</h2>
                    <p>Estos T&C se rigen por las leyes de la República de Chile. Para controversias con consumidores, se estará a la jurisdicción competente conforme a la Ley N° 19.496 (incluyendo el domicilio del consumidor cuando resulte aplicable). Para relaciones B2B con condominios/prestadores, la jurisdicción será la que se acuerde en el contrato B2B correspondiente, sin afectar derechos irrenunciables.</p>

                    <hr className="my-8" />

                    <p className="font-bold text-center">Al utilizar Estaciónate, usted acepta íntegramente estos Términos y Condiciones.</p>

                    <div className="mt-8 flex justify-center">
                        <Link to="/signup" className="bg-[#009EE3] text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                            Volver al Registro
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
