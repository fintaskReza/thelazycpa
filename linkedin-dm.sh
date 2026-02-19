#!/bin/bash
# LinkedIn DM Outreach Helper for TheLazyCPA
# This script helps you manage and track LinkedIn DM outreach

echo "💬 LinkedIn DM Outreach Manager"
echo "================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "⚠️  Server not running. Starting..."
    node server.js &
    sleep 2
fi

# Show current stats
echo "📊 Current Stats:"
curl -s http://localhost:3000/api/stats | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/stats
echo ""

# Menu
echo "What would you like to do?"
echo "1. View subscribers needing LinkedIn DMs"
echo "2. Export LinkedIn DM list (JSON)"
echo "3. Mark subscriber as DM sent"
echo "4. View all subscribers"
echo "5. Start server only"
echo "q. Quit"
echo ""
read -p "Enter choice: " choice

case $choice in
    1)
        echo ""
        echo "👥 Subscribers needing LinkedIn DMs:"
        curl -s http://localhost:3000/api/subscribers/linkedin-queue | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/subscribers/linkedin-queue
        echo ""
        echo "💡 Next steps:"
        echo "1. Search each person on LinkedIn"
        echo "2. Send personalized DM using template"
        echo "3. Mark as sent using option 3"
        ;;
    2)
        echo ""
        echo "📤 LinkedIn DM List:"
        curl -s http://localhost:3000/api/export/linkedin-dm-list | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/export/linkedin-dm-list
        echo ""
        echo "💡 Copy the names above and search on LinkedIn"
        ;;
    3)
        read -p "Enter email to mark as DM sent: " email
        curl -s -X POST http://localhost:3000/api/subscribers/$email/linkedin \
            -H "Content-Type: application/json" \
            -d '{"dm_sent": 1}' | python3 -m json.tool 2>/dev/null || echo "Updated"
        echo "✓ Marked as DM sent"
        ;;
    4)
        echo ""
        curl -s http://localhost:3000/api/subscribers | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/subscribers
        ;;
    5)
        echo "✓ Server running on http://localhost:3000"
        echo "📊 Stats: http://localhost:3000/api/stats"
        ;;
    q)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
