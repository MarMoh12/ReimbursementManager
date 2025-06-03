from rest_framework import serializers
from .models import (
    Application,
    ApplicationItem,
    FundingGroup,
    BudgetEntry,
    IncomeEntry,
    CashExpenseEntry,
    CashIncomeEntry
)
from django.contrib.auth.models import User

# 👤 Nutzer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

# 💰 Budgetkategorie
class BudgetEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetEntry
        fields = ['id', 'funding_group', 'category', 'amount']

# 💸 Einnahme
class IncomeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeEntry
        fields = ['id', 'funding_group', 'source', 'amount', 'received_at', 'comment']

# 🧾 Veranstaltung (FundingGroup)
class FundingGroupSerializer(serializers.ModelSerializer):
    budgets = BudgetEntrySerializer(many=True, read_only=True)
    income_entries = IncomeEntrySerializer(many=True, read_only=True)

    class Meta:
        model = FundingGroup
        fields = ['id', 'name', 'date', 'budgets', 'income_entries']

# 📌 Einzelposition in Antrag
class ApplicationItemSerializer(serializers.ModelSerializer):
    application = serializers.PrimaryKeyRelatedField(read_only=True)
    application_id = serializers.PrimaryKeyRelatedField(
        source='application',
        queryset=Application.objects.all(),
        write_only=True
    )

    budget_entry = BudgetEntrySerializer(read_only=True)
    budget_entry_id = serializers.PrimaryKeyRelatedField(
        source='budget_entry',
        queryset=BudgetEntry.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    funding_group = FundingGroupSerializer(read_only=True)
    funding_group_id = serializers.PrimaryKeyRelatedField(
        source='funding_group',
        queryset=FundingGroup.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = ApplicationItem
        fields = [
            'id', 'application', 'application_id',
            'position_number', 'description', 'amount',
            'budget_entry', 'budget_entry_id',
            'receipt_file',
            'funding_group', 'funding_group_id'
        ]
        read_only_fields = ['id', 'application']

# 📄 Antrag
class ApplicationSerializer(serializers.ModelSerializer):
    items = ApplicationItemSerializer(many=True, read_only=True)
    applicant = UserSerializer(read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'iban', 'account_holder', 'comment',
            'status', 'submitted_at', 'items'
        ]
        read_only_fields = ['id', 'submitted_at', 'items', 'applicant']

class CashExpenseEntrySerializer(serializers.ModelSerializer):
    application = ApplicationSerializer(read_only=True)
    application_id = serializers.PrimaryKeyRelatedField(
        source='application',
        queryset=Application.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    funding_group = FundingGroupSerializer(read_only=True)
    funding_group_id = serializers.PrimaryKeyRelatedField(
        source='funding_group',
        queryset=FundingGroup.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = CashExpenseEntry
        fields = [
            'id', 'amount', 'booking_date', 'comment',
            'application', 'application_id',
            'funding_group', 'funding_group_id',
            'created_at', 'balance_before', 'balance_after'
        ]
        read_only_fields = ['id', 'created_at', 'balance_before', 'balance_after']

class CashIncomeEntrySerializer(serializers.ModelSerializer):
    income_entry = IncomeEntrySerializer(read_only=True)
    income_entry_id = serializers.PrimaryKeyRelatedField(
        source='income_entry',
        queryset=IncomeEntry.objects.all(),
        write_only=True
    )
    funding_group = FundingGroupSerializer(read_only=True)
    funding_group_id = serializers.PrimaryKeyRelatedField(
        source='funding_group',
        queryset=FundingGroup.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = CashIncomeEntry
        fields = [
            'id', 'amount', 'booking_date', 'comment',
            'income_entry', 'income_entry_id',
            'funding_group', 'funding_group_id',
            'created_at', 'balance_before', 'balance_after'
        ]
        read_only_fields = ['id', 'created_at', 'balance_before', 'balance_after']

