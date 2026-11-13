
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_events": {
                  Row: {
                    "actor_id": string | null,"contact_id": string | null,"created_at": string,"data": NonNullable<Json>,"id": number,"kind": string,"opportunity_id": string | null,"organization_id": string,"summary": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"contact_id"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: never,"kind": string,"opportunity_id"?: string | null,"organization_id": string,"summary": string
                  }
                  Update: {
                    "actor_id"?: string | null,"contact_id"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: never,"kind"?: string,"opportunity_id"?: string | null,"organization_id"?: string,"summary"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"appointments": {
                  Row: {
                    "contact_id": string,"created_at": string,"created_by": string | null,"ends_at": string,"id": string,"location": string | null,"opportunity_id": string | null,"organization_id": string,"outcome": string | null,"provider": string,"provider_event_id": string | null,"purpose": string | null,"starts_at": string,"status": Database["public"]['Enums']["appt_status"],"timezone": string,"type": Database["public"]['Enums']["appt_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_id": string,"created_at"?: string,"created_by"?: string | null,"ends_at": string,"id"?: string,"location"?: string | null,"opportunity_id"?: string | null,"organization_id": string,"outcome"?: string | null,"provider"?: string,"provider_event_id"?: string | null,"purpose"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["appt_status"],"timezone": string,"type": Database["public"]['Enums']["appt_type"],"updated_at"?: string
                  }
                  Update: {
                    "contact_id"?: string,"created_at"?: string,"created_by"?: string | null,"ends_at"?: string,"id"?: string,"location"?: string | null,"opportunity_id"?: string | null,"organization_id"?: string,"outcome"?: string | null,"provider"?: string,"provider_event_id"?: string | null,"purpose"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["appt_status"],"timezone"?: string,"type"?: Database["public"]['Enums']["appt_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_contact_id_organization_id_fkey"
      columns: ["contact_id","organization_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "appointments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_opportunity_id_organization_id_fkey"
      columns: ["opportunity_id","organization_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "appointments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"data": NonNullable<Json>,"entity": string,"entity_id": string | null,"id": number,"organization_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"entity": string,"entity_id"?: string | null,"id"?: never,"organization_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"entity"?: string,"entity_id"?: string | null,"id"?: never,"organization_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"contacts": {
                  Row: {
                    "company": string | null,"created_at": string,"do_not_contact": boolean,"email": string | null,"full_name": string,"id": string,"merged_into": string | null,"opted_out_at": string | null,"organization_id": string,"owner_id": string | null,"phone": string | null,"phone_normalized": string | null,"preferred_contact": string | null,"restriction_note": string | null,"source": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company"?: string | null,"created_at"?: string,"do_not_contact"?: boolean,"email"?: string | null,"full_name": string,"id"?: string,"merged_into"?: string | null,"opted_out_at"?: string | null,"organization_id": string,"owner_id"?: string | null,"phone"?: string | null,"phone_normalized"?: never,"preferred_contact"?: string | null,"restriction_note"?: string | null,"source"?: string,"updated_at"?: string
                  }
                  Update: {
                    "company"?: string | null,"created_at"?: string,"do_not_contact"?: boolean,"email"?: string | null,"full_name"?: string,"id"?: string,"merged_into"?: string | null,"opted_out_at"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"phone"?: string | null,"phone_normalized"?: never,"preferred_contact"?: string | null,"restriction_note"?: string | null,"source"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contacts_merged_into_fkey"
      columns: ["merged_into"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contacts_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"demo_requests": {
                  Row: {
                    "company": string | null,"consent_at": string,"created_at": string,"email": string,"full_name": string,"id": string,"industry": string | null,"message": string | null,"team_size": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company"?: string | null,"consent_at": string,"created_at"?: string,"email": string,"full_name": string,"id"?: string,"industry"?: string | null,"message"?: string | null,"team_size"?: string | null
                  }
                  Update: {
                    "company"?: string | null,"consent_at"?: string,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"industry"?: string | null,"message"?: string | null,"team_size"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "demo_requests_industry_fkey"
      columns: ["industry"]
isOneToOne: false
      referencedRelation: "service_categories"
      referencedColumns: ["code"]
    }
                  ]
                },"discovery_sources": {
                  Row: {
                    "attribution_url": string | null,"created_at": string,"created_by": string | null,"id": string,"limitations": string | null,"name": string,"organization_id": string,"permitted_use": string,"provider": string | null,"refresh_note": string | null,"source_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attribution_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"limitations"?: string | null,"name": string,"organization_id": string,"permitted_use": string,"provider"?: string | null,"refresh_note"?: string | null,"source_type": string
                  }
                  Update: {
                    "attribution_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"limitations"?: string | null,"name"?: string,"organization_id"?: string,"permitted_use"?: string,"provider"?: string | null,"refresh_note"?: string | null,"source_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "discovery_sources_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "discovery_sources_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiries": {
                  Row: {
                    "answers": NonNullable<Json>,"consent_at": string | null,"consent_text": string | null,"contact_id": string,"created_at": string,"dedupe_hash": string | null,"duplicate_count": number,"first_response_at": string | null,"id": string,"landing_page_id": string | null,"message": string | null,"organization_id": string,"project_id": string | null,"received_at": string,"reference": string,"source": string,"status": Database["public"]['Enums']["qual_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"consent_at"?: string | null,"consent_text"?: string | null,"contact_id": string,"created_at"?: string,"dedupe_hash"?: string | null,"duplicate_count"?: number,"first_response_at"?: string | null,"id"?: string,"landing_page_id"?: string | null,"message"?: string | null,"organization_id": string,"project_id"?: string | null,"received_at"?: string,"reference"?: string,"source"?: string,"status"?: Database["public"]['Enums']["qual_status"]
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"consent_at"?: string | null,"consent_text"?: string | null,"contact_id"?: string,"created_at"?: string,"dedupe_hash"?: string | null,"duplicate_count"?: number,"first_response_at"?: string | null,"id"?: string,"landing_page_id"?: string | null,"message"?: string | null,"organization_id"?: string,"project_id"?: string | null,"received_at"?: string,"reference"?: string,"source"?: string,"status"?: Database["public"]['Enums']["qual_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiries_contact_id_organization_id_fkey"
      columns: ["contact_id","organization_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "enquiries_landing_page_id_organization_id_fkey"
      columns: ["landing_page_id","organization_id"]
isOneToOne: false
      referencedRelation: "landing_pages"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "enquiries_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enquiries_project_id_organization_id_fkey"
      columns: ["project_id","organization_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id","organization_id"]
    }
                  ]
                },"industry_templates": {
                  Row: {
                    "code": string,"created_at": string,"definition": NonNullable<Json>,"id": string,"name": string,"published": boolean,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"definition": NonNullable<Json>,"id"?: string,"name": string,"published"?: boolean,"version": number
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"definition"?: NonNullable<Json>,"id"?: string,"name"?: string,"published"?: boolean,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "industry_templates_code_fkey"
      columns: ["code"]
isOneToOne: false
      referencedRelation: "service_categories"
      referencedColumns: ["code"]
    }
                  ]
                },"integrations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"enabled": boolean,"events": (string)[],"id": string,"kind": string,"last_delivery_at": string | null,"last_status": string | null,"organization_id": string,"secret": string,"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"enabled"?: boolean,"events"?: (string)[],"id"?: string,"kind"?: string,"last_delivery_at"?: string | null,"last_status"?: string | null,"organization_id": string,"secret"?: string,"updated_at"?: string,"url": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"enabled"?: boolean,"events"?: (string)[],"id"?: string,"kind"?: string,"last_delivery_at"?: string | null,"last_status"?: string | null,"organization_id"?: string,"secret"?: string,"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "integrations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "integrations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"organization_id": string,"role": Database["public"]['Enums']["member_role"],"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"organization_id": string,"role"?: Database["public"]['Enums']["member_role"],"token"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"organization_id"?: string,"role"?: Database["public"]['Enums']["member_role"],"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"landing_page_versions": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"content": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"organization_id": string,"page_id": string,"published_at": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"content": NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"organization_id": string,"page_id": string,"published_at"?: string | null,"version": number
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"organization_id"?: string,"page_id"?: string,"published_at"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "landing_page_versions_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "landing_page_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "landing_page_versions_page_id_organization_id_fkey"
      columns: ["page_id","organization_id"]
isOneToOne: false
      referencedRelation: "landing_pages"
      referencedColumns: ["id","organization_id"]
    }
                  ]
                },"landing_pages": {
                  Row: {
                    "created_at": string,"draft": NonNullable<Json>,"id": string,"organization_id": string,"published_at": string | null,"published_version_id": string | null,"slug": string,"status": Database["public"]['Enums']["page_status"],"submitted_version_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"draft"?: NonNullable<Json>,"id"?: string,"organization_id": string,"published_at"?: string | null,"published_version_id"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["page_status"],"submitted_version_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"draft"?: NonNullable<Json>,"id"?: string,"organization_id"?: string,"published_at"?: string | null,"published_version_id"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["page_status"],"submitted_version_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "landing_pages_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "landing_pages_published_fk"
      columns: ["published_version_id"]
isOneToOne: false
      referencedRelation: "landing_page_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "landing_pages_submitted_fk"
      columns: ["submitted_version_id"]
isOneToOne: false
      referencedRelation: "landing_page_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"id": string,"organization_id": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"organization_id": string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"organization_id"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_profile_fk"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "author_id": string | null,"body": string,"contact_id": string | null,"created_at": string,"id": string,"opportunity_id": string | null,"organization_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"contact_id"?: string | null,"created_at"?: string,"id"?: string,"opportunity_id"?: string | null,"organization_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"contact_id"?: string | null,"created_at"?: string,"id"?: string,"opportunity_id"?: string | null,"organization_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_contact_id_organization_id_fkey"
      columns: ["contact_id","organization_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "notes_opportunity_id_organization_id_fkey"
      columns: ["opportunity_id","organization_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_outbox": {
                  Row: {
                    "attempts": number,"created_at": string,"dedupe_key": string | null,"id": string,"kind": string,"last_error": string | null,"next_attempt_at": string,"organization_id": string | null,"payload": NonNullable<Json>,"sent_at": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"kind": string,"last_error"?: string | null,"next_attempt_at"?: string,"organization_id"?: string | null,"payload"?: NonNullable<Json>,"sent_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "attempts"?: number,"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"kind"?: string,"last_error"?: string | null,"next_attempt_at"?: string,"organization_id"?: string | null,"payload"?: NonNullable<Json>,"sent_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_outbox_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"onboarding": {
                  Row: {
                    "completed_steps": (string)[],"organization_id": string,"review_note": string | null,"status": Database["public"]['Enums']["onboarding_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_steps"?: (string)[],"organization_id": string,"review_note"?: string | null,"status"?: Database["public"]['Enums']["onboarding_status"],"updated_at"?: string
                  }
                  Update: {
                    "completed_steps"?: (string)[],"organization_id"?: string,"review_note"?: string | null,"status"?: Database["public"]['Enums']["onboarding_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "onboarding_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"onboarding_transitions": {
                  Row: {
                    "actor_id": string | null,"actor_kind": string,"created_at": string,"from_status": Database["public"]['Enums']["onboarding_status"] | null,"id": number,"note": string | null,"organization_id": string,"to_status": Database["public"]['Enums']["onboarding_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"actor_kind"?: string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["onboarding_status"] | null,"id"?: never,"note"?: string | null,"organization_id": string,"to_status": Database["public"]['Enums']["onboarding_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_kind"?: string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["onboarding_status"] | null,"id"?: never,"note"?: string | null,"organization_id"?: string,"to_status"?: Database["public"]['Enums']["onboarding_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "onboarding_transitions_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "onboarding_transitions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "closed_at": string | null,"contact_id": string,"created_at": string,"currency": string | null,"enquiry_id": string | null,"id": string,"loss_note": string | null,"loss_reason": Database["public"]['Enums']["loss_reason"] | null,"organization_id": string,"owner_id": string | null,"project_id": string | null,"stage": Database["public"]['Enums']["opp_stage"],"stage_changed_at": string,"title": string,"updated_at": string,"value_minor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "closed_at"?: string | null,"contact_id": string,"created_at"?: string,"currency"?: string | null,"enquiry_id"?: string | null,"id"?: string,"loss_note"?: string | null,"loss_reason"?: Database["public"]['Enums']["loss_reason"] | null,"organization_id": string,"owner_id"?: string | null,"project_id"?: string | null,"stage"?: Database["public"]['Enums']["opp_stage"],"stage_changed_at"?: string,"title": string,"updated_at"?: string,"value_minor"?: number | null
                  }
                  Update: {
                    "closed_at"?: string | null,"contact_id"?: string,"created_at"?: string,"currency"?: string | null,"enquiry_id"?: string | null,"id"?: string,"loss_note"?: string | null,"loss_reason"?: Database["public"]['Enums']["loss_reason"] | null,"organization_id"?: string,"owner_id"?: string | null,"project_id"?: string | null,"stage"?: Database["public"]['Enums']["opp_stage"],"stage_changed_at"?: string,"title"?: string,"updated_at"?: string,"value_minor"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_contact_id_organization_id_fkey"
      columns: ["contact_id","organization_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "opportunities_enquiry_id_organization_id_fkey"
      columns: ["enquiry_id","organization_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "opportunities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_project_id_organization_id_fkey"
      columns: ["project_id","organization_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id","organization_id"]
    }
                  ]
                },"org_questions": {
                  Row: {
                    "active": boolean,"created_at": string,"disqualify_values": NonNullable<Json>,"id": string,"is_public": boolean,"key": string,"kind": string,"label": string,"options": NonNullable<Json>,"organization_id": string,"required": boolean,"sort": number,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"disqualify_values"?: NonNullable<Json>,"id"?: string,"is_public"?: boolean,"key": string,"kind": string,"label": string,"options"?: NonNullable<Json>,"organization_id": string,"required"?: boolean,"sort"?: number,"source"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"disqualify_values"?: NonNullable<Json>,"id"?: string,"is_public"?: boolean,"key"?: string,"kind"?: string,"label"?: string,"options"?: NonNullable<Json>,"organization_id"?: string,"required"?: boolean,"sort"?: number,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "org_questions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"org_services": {
                  Row: {
                    "category_code": string,"created_at": string,"focus": string,"organization_id": string,"template_version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category_code": string,"created_at"?: string,"focus"?: string,"organization_id": string,"template_version"?: number
                  }
                  Update: {
                    "category_code"?: string,"created_at"?: string,"focus"?: string,"organization_id"?: string,"template_version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "org_services_category_code_fkey"
      columns: ["category_code"]
isOneToOne: false
      referencedRelation: "service_categories"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "org_services_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "contact_name": string | null,"country": string,"created_at": string,"created_by": string | null,"currency": string,"id": string,"name": string,"phone": string | null,"plan_code": string,"settings": NonNullable<Json>,"slug": string,"timezone": string,"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_name"?: string | null,"country"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"name": string,"phone"?: string | null,"plan_code"?: string,"settings"?: NonNullable<Json>,"slug": string,"timezone"?: string,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "contact_name"?: string | null,"country"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"name"?: string,"phone"?: string | null,"plan_code"?: string,"settings"?: NonNullable<Json>,"slug"?: string,"timezone"?: string,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizations_plan_fk"
      columns: ["plan_code"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["code"]
    }
                  ]
                },"plan_entitlements": {
                  Row: {
                    "key": string,"limit_value": number | null,"plan_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"limit_value"?: number | null,"plan_code": string
                  }
                  Update: {
                    "key"?: string,"limit_value"?: number | null,"plan_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_entitlements_plan_code_fkey"
      columns: ["plan_code"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["code"]
    }
                  ]
                },"plans": {
                  Row: {
                    "code": string,"currency": string,"illustrative": boolean,"monthly_price_minor": number,"name": string,"positioning": string,"setup_fee_minor": number,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"currency": string,"illustrative"?: boolean,"monthly_price_minor": number,"name": string,"positioning": string,"setup_fee_minor": number,"sort"?: number
                  }
                  Update: {
                    "code"?: string,"currency"?: string,"illustrative"?: boolean,"monthly_price_minor"?: number,"name"?: string,"positioning"?: string,"setup_fee_minor"?: number,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active_organization_id": string | null,"created_at": string,"email": string | null,"full_name": string | null,"id": string,"notifications_seen_at": string | null,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_organization_id"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"notifications_seen_at"?: string | null,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active_organization_id"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"notifications_seen_at"?: string | null,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_active_org_fk"
      columns: ["active_organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"project_records": {
                  Row: {
                    "category_code": string | null,"contact_email": string | null,"contact_name": string | null,"contact_permission": string,"contact_phone": string | null,"currency": string | null,"description": string | null,"estimated_value_minor": number | null,"external_id": string,"id": string,"imported_at": string,"last_verified_at": string | null,"location_text": string | null,"observed_at": string | null,"organization_id": string,"postcode": string | null,"project_stage": string | null,"saved_at": string | null,"saved_opportunity_id": string | null,"saved_project_id": string | null,"source_id": string,"source_url": string | null,"status": string,"timeline": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_code"?: string | null,"contact_email"?: string | null,"contact_name"?: string | null,"contact_permission"?: string,"contact_phone"?: string | null,"currency"?: string | null,"description"?: string | null,"estimated_value_minor"?: number | null,"external_id": string,"id"?: string,"imported_at"?: string,"last_verified_at"?: string | null,"location_text"?: string | null,"observed_at"?: string | null,"organization_id": string,"postcode"?: string | null,"project_stage"?: string | null,"saved_at"?: string | null,"saved_opportunity_id"?: string | null,"saved_project_id"?: string | null,"source_id": string,"source_url"?: string | null,"status"?: string,"timeline"?: string | null,"title": string
                  }
                  Update: {
                    "category_code"?: string | null,"contact_email"?: string | null,"contact_name"?: string | null,"contact_permission"?: string,"contact_phone"?: string | null,"currency"?: string | null,"description"?: string | null,"estimated_value_minor"?: number | null,"external_id"?: string,"id"?: string,"imported_at"?: string,"last_verified_at"?: string | null,"location_text"?: string | null,"observed_at"?: string | null,"organization_id"?: string,"postcode"?: string | null,"project_stage"?: string | null,"saved_at"?: string | null,"saved_opportunity_id"?: string | null,"saved_project_id"?: string | null,"source_id"?: string,"source_url"?: string | null,"status"?: string,"timeline"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_records_category_code_fkey"
      columns: ["category_code"]
isOneToOne: false
      referencedRelation: "service_categories"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "project_records_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_records_source_id_organization_id_fkey"
      columns: ["source_id","organization_id"]
isOneToOne: false
      referencedRelation: "discovery_sources"
      referencedColumns: ["id","organization_id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "budget_label": string | null,"budget_max_minor": number | null,"budget_min_minor": number | null,"category_code": string | null,"contact_id": string | null,"created_at": string,"currency": string | null,"description": string | null,"details": NonNullable<Json>,"id": string,"location_text": string | null,"organization_id": string,"postcode": string | null,"start_timing": string | null,"template_version": number | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_label"?: string | null,"budget_max_minor"?: number | null,"budget_min_minor"?: number | null,"category_code"?: string | null,"contact_id"?: string | null,"created_at"?: string,"currency"?: string | null,"description"?: string | null,"details"?: NonNullable<Json>,"id"?: string,"location_text"?: string | null,"organization_id": string,"postcode"?: string | null,"start_timing"?: string | null,"template_version"?: number | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "budget_label"?: string | null,"budget_max_minor"?: number | null,"budget_min_minor"?: number | null,"category_code"?: string | null,"contact_id"?: string | null,"created_at"?: string,"currency"?: string | null,"description"?: string | null,"details"?: NonNullable<Json>,"id"?: string,"location_text"?: string | null,"organization_id"?: string,"postcode"?: string | null,"start_timing"?: string | null,"template_version"?: number | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_category_code_fkey"
      columns: ["category_code"]
isOneToOne: false
      referencedRelation: "service_categories"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "projects_contact_id_organization_id_fkey"
      columns: ["contact_id","organization_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "projects_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"qualification_records": {
                  Row: {
                    "answers": NonNullable<Json>,"created_at": string,"enquiry_id": string,"id": string,"organization_id": string,"reason": string | null,"recorded_by": string | null,"status": Database["public"]['Enums']["qual_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"created_at"?: string,"enquiry_id": string,"id"?: string,"organization_id": string,"reason"?: string | null,"recorded_by"?: string | null,"status": Database["public"]['Enums']["qual_status"]
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"created_at"?: string,"enquiry_id"?: string,"id"?: string,"organization_id"?: string,"reason"?: string | null,"recorded_by"?: string | null,"status"?: Database["public"]['Enums']["qual_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "qualification_records_enquiry_id_organization_id_fkey"
      columns: ["enquiry_id","organization_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "qualification_records_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "qualification_records_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"service_areas": {
                  Row: {
                    "created_at": string,"id": string,"label": string,"organization_id": string,"postcode": string | null,"radius_km": number | null,"region": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"label": string,"organization_id": string,"postcode"?: string | null,"radius_km"?: number | null,"region"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"label"?: string,"organization_id"?: string,"postcode"?: string | null,"radius_km"?: number | null,"region"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_areas_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"service_categories": {
                  Row: {
                    "code": string,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"name": string,"sort"?: number
                  }
                  Update: {
                    "code"?: string,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"tasks": {
                  Row: {
                    "assignee_id": string | null,"completed_at": string | null,"contact_id": string | null,"created_at": string,"created_by": string | null,"due_at": string | null,"id": string,"notes": string | null,"opportunity_id": string | null,"organization_id": string,"status": Database["public"]['Enums']["task_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"contact_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"due_at"?: string | null,"id"?: string,"notes"?: string | null,"opportunity_id"?: string | null,"organization_id": string,"status"?: Database["public"]['Enums']["task_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"contact_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"due_at"?: string | null,"id"?: string,"notes"?: string | null,"opportunity_id"?: string | null,"organization_id"?: string,"status"?: Database["public"]['Enums']["task_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_contact_id_organization_id_fkey"
      columns: ["contact_id","organization_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_opportunity_id_organization_id_fkey"
      columns: ["opportunity_id","organization_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id","organization_id"]
    },{
      foreignKeyName: "tasks_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"usage_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"id": number,"kind": string,"organization_id": string,"quantity": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"kind": string,"organization_id": string,"quantity"?: number
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"kind"?: string,"organization_id"?: string,"quantity"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "usage_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "usage_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_token": string }; Returns: string
                           },
"add_activity":
{ Args: { "contact": string,"opp": string,"org": string,"p_data"?: Json,"p_kind": string,"p_summary": string }; Returns: undefined
                           },
"advance_onboarding":
{ Args: { "p_to": Database["public"]['Enums']["onboarding_status"] }; Returns: Database["public"]['Enums']["onboarding_status"]
                           },
"approve_landing_page":
{ Args: { "p_page": string }; Returns: undefined
                           },
"appt_label":
{ Args: { "t": Database["public"]['Enums']["appt_type"] }; Returns: string
                           },
"claim_notifications":
{ Args: { "p_limit"?: number }; Returns: {
              "attempts": number,
"created_at": string,
"dedupe_key": string | null,
"id": string,
"kind": string,
"last_error": string | null,
"next_attempt_at": string,
"organization_id": string | null,
"payload": NonNullable<Json>,
"sent_at": string | null,
"status": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "notification_outbox"
        isOneToOne: false
        isSetofReturn: true
      } },
"create_organization":
{ Args: { "p_country"?: string,"p_currency"?: string,"p_name": string,"p_slug": string,"p_timezone"?: string }; Returns: string
                           },
"enqueue_integration_event":
{ Args: { "p_data": Json,"p_event": string,"p_key": string,"p_org": string }; Returns: undefined
                           },
"finish_notification":
{ Args: { "p_error"?: string,"p_id": string,"p_ok": boolean,"p_skipped"?: boolean }; Returns: undefined
                           },
"get_public_page":
{ Args: { "p_slug": string }; Returns: Json
                           },
"hit_rate_limit":
{ Args: { "p_key": string,"p_max": number,"p_window": string }; Returns: boolean
                           },
"is_org_member":
{ Args: { "org": string }; Returns: boolean
                           },
"is_org_owner":
{ Args: { "org": string }; Returns: boolean
                           },
"log_audit":
{ Args: { "org": string,"p_action": string,"p_data"?: Json,"p_entity": string,"p_entity_id": string }; Returns: undefined
                           },
"move_onboarding":
{ Args: { "p_actor_kind"?: string,"p_note"?: string,"p_org": string,"p_to": Database["public"]['Enums']["onboarding_status"] }; Returns: Database["public"]['Enums']["onboarding_status"]
                           },
"onboarding_can_move":
{ Args: { "from_s": Database["public"]['Enums']["onboarding_status"],"to_s": Database["public"]['Enums']["onboarding_status"] }; Returns: boolean
                           },
"publish_landing_page":
{ Args: { "p_page": string }; Returns: undefined
                           },
"record_export":
{ Args: { "p_count": number,"p_entity": string,"p_filters"?: Json }; Returns: undefined
                           },
"record_integration_delivery":
{ Args: { "p_id": string,"p_status": string }; Returns: undefined
                           },
"review_onboarding":
{ Args: { "p_org": string }; Returns: Database["public"]['Enums']["onboarding_status"]
                           },
"save_project_record":
{ Args: { "p_record": string }; Returns: Json
                           },
"set_active_organization":
{ Args: { "p_org": string }; Returns: undefined
                           },
"set_landing_page_paused":
{ Args: { "p_page": string,"p_paused": boolean }; Returns: undefined
                           },
"set_project_record_status":
{ Args: { "p_record": string,"p_status": string }; Returns: undefined
                           },
"stage_label":
{ Args: { "s": Database["public"]['Enums']["opp_stage"] }; Returns: string
                           },
"storage_org_from_path":
{ Args: { "p_name": string }; Returns: string
                           },
"submit_demo_request":
{ Args: { "p": Json,"p_fingerprint": string }; Returns: Json
                           },
"submit_landing_page":
{ Args: { "p_page": string }; Returns: string
                           },
"submit_public_enquiry":
{ Args: { "p": Json,"p_fingerprint": string,"p_slug": string }; Returns: Json
                           },
"usage_remaining":
{ Args: { "p_kind": string,"p_org": string }; Returns: number
                           }
          }
          Enums: {
            "appt_status": "scheduled"|"confirmed"|"attended"|"no_show"|"cancelled"|"rescheduled","appt_type": "phone"|"video"|"site_visit","loss_reason": "no_response"|"outside_area"|"budget_mismatch"|"timing"|"competitor"|"not_a_fit"|"other","member_role": "owner"|"member","onboarding_status": "not_started"|"in_progress"|"submitted"|"needs_changes"|"approved"|"active","opp_stage": "new"|"reviewing"|"contact_attempted"|"connected"|"qualified"|"appointment_booked"|"proposal"|"won"|"lost","page_status": "draft"|"internal_review"|"awaiting_approval"|"approved"|"published"|"paused"|"archived","qual_status": "unreviewed"|"qualifying"|"qualified"|"disqualified","task_status": "open"|"done"|"cancelled"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "appt_status": ["scheduled", "confirmed", "attended", "no_show", "cancelled", "rescheduled"],"appt_type": ["phone", "video", "site_visit"],"loss_reason": ["no_response", "outside_area", "budget_mismatch", "timing", "competitor", "not_a_fit", "other"],"member_role": ["owner", "member"],"onboarding_status": ["not_started", "in_progress", "submitted", "needs_changes", "approved", "active"],"opp_stage": ["new", "reviewing", "contact_attempted", "connected", "qualified", "appointment_booked", "proposal", "won", "lost"],"page_status": ["draft", "internal_review", "awaiting_approval", "approved", "published", "paused", "archived"],"qual_status": ["unreviewed", "qualifying", "qualified", "disqualified"],"task_status": ["open", "done", "cancelled"]
          }
        }
} as const
